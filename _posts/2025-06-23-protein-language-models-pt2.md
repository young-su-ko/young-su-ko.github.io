---
layout: post
category: projects
title: training protein language models / cramming challenge (ii)
---

#### model is ready, now what?
To recap, I previously documented what I learned from implementing the ESM2 model. Now, I have to set up the code to actually train a pLM. To do so, I need the following:

1. A tokenizer to convert fasta sequences into numbers.
2. A dataset + dataloader
3. Pre-training code implemented with Pytorch Lightning

##### a simple tokenizer for proteins
For regular language models, both word-based and character-based tokenizers have serious limitations. For word-based tokenization, the vocab size can be huge and out-of-vocabulary words are a concern. For character-based tokenization, the context-length can blow up. As a result, byte-pair encoding (BPE) has become a standard for LLM tokenization.

However, a nice property for proteins is that there are only ~20 "words" (the 20 standard amino acids) in the protein language. This means we can take the simplest approach, character-level tokenization (which is effectively word-level, since each character is a semantic unit). BPE has been used for protein sequence tokenization and showed it can compress the sequences by 64%[^1], but for this project, I'll start off simple.

ESM2 has a vocab size of 33, comprising of the 20 AAs, 5 rare/ambiguous AAs (X,B,U,Z,O), 5 model tokens (cls, pad, eos, unk, mask) and 3 tokens that seemed pretty random (.,-,null)[^2].

For each sequence, we prepend a <cls\> token and append an <eos\> token. Since we'll be randomly cropping sequences that are too long, the absence of these tokens can indicate to the model that it's looking at a cropped section.

In code, since our tokenization is just splitting at the character level, all we have to do is set up a dictionary that maps each token to an integer index (token_to_index), and then convert a sequence into a list of indices:
```python
def get_idx(tok) -> int:
    return token_to_index[tok]

def encode(sequence: str) -> list[int]:
    return [get_idx(tok) for tok in sequence]
```

##### a Dataset for protein sequences
Since the pLM will be trained on a pre-determined Uniref50 split[^3], we don't have to worry about clustering/de-duplicating Uniref. This dataset contains the amino acid sequences, which is all we need for masked language modeling (MLM)

To handle batching, we'll use the PyTorch `Dataset`. The heavy lifting is handled by the `__getitem__` method, which performs three main tasks: cropping, padding mask creation, and token masking.
First, we initialize the `input_ids` and `labels` tensor with all padding tokens.
```python
input_ids = torch.full((max_length,), tokenizer.pad_idx, dtype=torch.long)
labels = torch.full((max_length,), tokenizer.pad_idx, dtype=torch.long)
```

Then, we tokenize/encode the input protein sequence. If the protein is longer than `max_length`, we randomly select a max-length long crop. If it's shorter, then we leave it as it is.
```python
if len(tokens) > max_length:
    start = random.randint(0, len(tokens) - max_length)
    tokens = tokens[start:start + max_length]
```
We then create an attention mask to indicate which positions are real (as opposed to padding tokens)
```python
attn_mask = torch.zeros(max_length, dtype=torch.bool)
attn_mask[:len(tokens)] = 1 # True for real tokens
```
The last step is to mask x% of the tokens for MLM. We don't want to mask any of the special tokens, like <cls\> or <pad\>, so we restrict the "candidates" for masking to be the tokens that are neither pad or special:
```python
special_mask = tokenizer.special_toks_mask[input_ids]
candidates = attn_mask & ~special_mask # attn_mask is True for real, and not special tokens
mask_tokens = (torch.rand(max_length) < mask_prob) & candidates
labels[mask_tokens] = input_ids[mask_tokens]
input_ids[mask_tokens] = tokenizer.mask_idx
```
Since cross entropy only cares about the masked tokens, I initialized the `labels` to be a tensor full of padding tokens, and only add back in the true tokens for the masked positions. Similar idea for `input_ids`, except it's to handle the sequence padding. 

Since we set all sequences to `max_length`[^4], `collate_fn` can simply stack the `labels`,`input_ids`, and `attn_mask`.

##### training loop
Given that PyTorch Lightning handles all of the annoying device management, backprop, optimizer updates, etc, all I had to do is set up the `train_step` and `val_step`. To make things even nicer, the only difference between the steps are logging, so we could use a `shared_step`. 

All we need to do is take the inputs and mask, feed it to our ESM2 model, which outputs the logits. Then we calculate the loss using the logits and the labels. Since our batch returns the `labels` with everything but the masked positions set to padding tokens, this is very simple.

```python
criterion = nn.CrossEntropyLoss(ignore_index=padding_idx)

def shared_step(self, batch, stage: str):
    input_ids = batch['input_ids']
    padding_mask = batch['attn_mask'] #
    
    outputs = model(input_ids, padding_mask)
    logits = outputs['logits']
    
    logits = logits.reshape(-1, logits.shape[-1])
    labels = batch['labels'].reshape(-1)
        
    loss = criterion(logits, labels)
    perplexity = torch.exp(loss)

    return loss
```

The optimizer and scheduler was easy to set up, just use `configure_optimizers()`, so I'll skip those details.

#### conclusion
I realized that a standard pLM does not have as many moving parts as I imagined. Personally, from hardest to easiest to implement, I would say:

1. Dataset/Dataloader
2. Transformer
3. Tokenizer
4. Training code

Which was kind of surprising, but maybe it's a good thing. It's definitely possible to simplify the Dataset and do the mask creation/etc in the training code, but I like having the data preparation completely separated from the forward pass, because it makes the forward pass code so simple. 

So in conclusion, setting up a pLM is surprisingly approachable when you tackle it piece by piece. Once you have all the parts, it falls into place nicely. Note, I left out a lot of the hurdles/bugs I ran into--I'll document those in the next post. You can also check out the state of the repository [here](https://github.com/young-su-ko/protein-language-model).

---
{: data-content="footnotes"}
[^1]: [Pre-training Protein Language Models with Label-Agnostic Binding Pairs Enhances Performance in Downstream Tasks](https://arxiv.org/abs/2012.03084)
[^2]: I guess the dash token can be used for a gap, but I'm not sure why a sequence would be gapped, since they aren't aligned. It seems these other two tokens are added to pad the embedding dictionary size. [See here](https://github.com/facebookresearch/esm/issues/84)
[^3]: This is the split used by the authors of the cramming challenge, available on [HuggingFace](https://huggingface.co/datasets/taylor-joren/uniref50).
[^4]: Initially I wanted to use the longest sequence in a batch to determine the amount of padding--this would be more memory-efficient when the max length within a batch was much smaller than the global `max_length` parameter we set. Our `collate_fn` would be more complex and dynamically handle padding to the batch's max length. But because we set `max_length` to 512 and most sequences are around that length, it was more efficient to initialize `max_length` size tensors. 