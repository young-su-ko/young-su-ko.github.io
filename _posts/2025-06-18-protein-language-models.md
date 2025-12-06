---
layout: post
category: projects
title: training protein language models / cramming challenge (i)
---

#### i've never trained a protein language model
The purpose of this entry is not to talk about why and how protein language models (pLMs) are being used in the field--I'll talk about this another time. Today, I'm asking myself the question, "why haven't I trained a pLM before?"

I came across this post by Patrick Kidger[^1] on X, and saw this advice:
>Implement the ESM2 architecture yourself. (This is the exercise I’m suggesting here that I’ve found most personally valuable.)

I know implementing something is one of the best way to understand it. So why haven't I implemented ESM2, even though it's been a central part of my research? My excuse was that state-of-the-art pLMs are very expensive to train. ESM2 used 512 GPUs so I reasoned it was pointless for me to try (Yeah, this was a terrible excuse).

Recently I came across this paper from Prescient Design[^2], where they showed they could train a pretty competitive 67M pLM in 24 GPU hours. This is called the "cramming" challenge--training the best model you can in a day.

Now I really had no excuses. The goal is simple: first, implement the ESM2 architecture then second, cram/train a competitive pLM. For the sake of organization, I'll focus only on the lessons I learned from implementation in this page (and talk about training in a separate page).

##### implementing ESM2
By implementing, I mean code up the ESM2 model and all it's submodules. While doing so, I want to make sure I take note of anything I previously didn't fully understand, both conceptually and code-wise. I also want to focus on the engineering quality of my code (modularity, readability, etc)[^3]. 

##### multihead attention
Let me try to explain it in plain English first.
1. Project input into Q, K, and V.
2. Apply rotary positional embeddings to Q and K.
3. Create head dimension by splitting the embedding dimension.
4. Matrix multiply Q and K.T, then divide by scaling.
5. Apply softmax then matrix multiply with V.
6. Combine heads, then do nn.Linear to project to output.

I remember seeing code for it and being confused. Now I realize it's because of the view and permute calls. Using einops rearrange made it way more intuitive for me, going from:
```python
q = q.view(bsz, -1, self.n_heads, self.hid_dim // self.n_heads).permute(0, 2, 1, 3)
```
to
```python
q = rearrange(q, "b l (hd) -> b h l d", h=self.n_heads)
```
I apologize to myself from two years ago for thinking einops was a waste of time. 


##### rotary positional encodings (RoPE)
To understand RoPE, I need to first recall how to rotate a 2D vector. We can multiply a vector by the rotation matrix:

$$ \begin{bmatrix} x'\\ y' \end{bmatrix}= \begin{bmatrix} \cos{\theta} & -\sin{\theta} \\ \sin{\theta} & \cos{\theta} \end{bmatrix} \begin{bmatrix} x\\ y \end{bmatrix} $$

$$ \begin{bmatrix} x'\\ y' \end{bmatrix}= \begin{bmatrix} x\cos{\theta} -y\sin{\theta}\\ x\sin{\theta}  + y \cos{\theta} \end{bmatrix} $$

But another way to write it is to reorder the second row so that the cos and sin line up.

$$ \begin{bmatrix} x'\\ y' \end{bmatrix}= \begin{bmatrix} x\cos{\theta} -y\sin{\theta}\\ y \cos{\theta}+x\sin{\theta}  \end{bmatrix} $$

Then the rotation can be expressed as two vector operations.

$$ \begin{bmatrix} x'\\ y' \end{bmatrix}= \begin{bmatrix} x \\ y \end{bmatrix}\cos{\theta}  + \begin{bmatrix} -y \\ x \end{bmatrix}\sin{\theta} $$

This is how rotation is done in code, as the vector operations is more efficient than multiplying by a giant rotation matrix.
```python
def rotate_input(x):
    x1, x2 = x.chunk(2, dim=-1)
    return torch.cat((-x2, x1), dim=-1)

def apply_rotation(x, cos, sin):
    return (x * cos) + (rotate_input(x) * sin)
```

Ok, so we know how to rotate vectors. Now the question is what's $$\theta$$, the rotation amount? The rotation amount depends on both the token position and the channel dimension within a token embedding. 

First, let's just say we token dim=1024. We set an inverse frequency so that the channel dimensions closer to 0 rotate slowly, while the channel dimensions closer to 1024 rotate faster. 
```python
inv_freq = 1.0 / (10000 ** (torch.arange(0, dim, 2).float() / dim))
```
For each token position t, we multiply by inv_freq, so that each position and pair of channel dim has a unique rotation amount.
```python
t = torch.arange(x.shape[seq_dimension])
freqs = torch.einsum("i,j->ij", t, self.inv_freq)
emb = torch.cat((freqs, freqs), dim=-1)
```
Then the cos and sin we used for rotation can be made:
```python
cos = emb.cos()
sin = emb.sin()
```

So now I understand how it's implemented. I want to read the original paper[^4] in more depth, especially this "long-term decay" property mentioned in the text.

##### language-modeling head (LMHead)
Ok this was the last thing that was new to me. So I knew that the output of the final transformer layer is used to create the logits, which are then converted to probabilities using softmax.

What I didn't know was this concept called "weight tying"[^5]. The main idea is that the weights of the input embedding layer (the one that converts vocab_size -> dim) is shared with the output projection layer (dim -> vocab_size).

From what I'm reading, this seems more important for regular language models. Since the vocab size is very large for natural language, without weight tying, you have to create two giant (vocab_size, dim) matrices, which could be expensive[^6]. But for pLMs, since the vocab_size is only around 30, I don't know if it makes a huge difference efficiency-wise.

#### conclusion
So now we have the ESM2 model architecture was set up. While this was fun, I am also looking forward to the actual training. Spoiler alert: I ran into many little challenges for training, and will document them in the next post.

---
{: data-content="footnotes"}
[^1]: [Just know stuff, proteinML edition](https://kidger.site/thoughts/just-know-stuff-protein-ml/)
[^2]: [Cramming Protein Language Model Training in 24 GPU Hours](https://www.biorxiv.org/content/10.1101/2024.05.14.594108v1)
[^3]: When I first started my PhD, I didn't think about this at all. I kind of cringe when I look at the repository for my first project, TUnA 😬. I can definitely do a better job with the code now and it's been on my bucket list to do a complete makeover of this code.
[^4]: [RoFormer: Enhanced transformer with Rotary Position Embedding](https://www.sciencedirect.com/science/article/pii/S0925231223011864#sec4)
[^5]: [Using the Output Embedding to Improve Language Models](https://arxiv.org/pdf/1608.05859v3)
[^6]: There are some other discussion that say weight tying doesn't really matter for modern LLMs since they are so big, the overhead from the embedding matrix is negligble. This makes sense to me too. [See thread](https://www.reddit.com/r/MachineLearning/comments/1d2iurw/d_should_the_embedding_matrix_and_final/)