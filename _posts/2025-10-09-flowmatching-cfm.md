---
layout: post
category: concepts
title: flow matching (loss)
---

Picking up from the previous discussion on [vector fields](flowmatching-vectorfields.html), let's go through how flow matching models are trained.

#### flow matching loss 
We want to train a neural network, $$u_t^\theta$$, to match the marginal vector field $$u_t^{\text{target}}$$. If we have $$u_t^\theta$$, we can transform a sample from our simple prior distribution into one from our desired data distribution.

To train the neural network, we can simply use the mean-square error between $$u_t^\theta$$ and $$u_t^{\text{target}}$$. This is referred to as the **flow matching loss**:

$$
\mathcal{L}_{\text{FM}}(\theta) = \mathbb{E}_{t \sim \mathcal{U}[0,1], x \sim p_t} [ \| u_t^\theta(x) - u_t^{\text{target}}(x)\|^2 ]
$$

To sample from the marginal probability path $$p_t$$, we can first sample $$z \sim p_{\text{data}}$$, then get the conditional probability path $$p_t(x \vert z)$$.

To summarize, we draw a timepoint between 0 and 1. Using that timepoint, we draw from the probability path. We can feed that into our neural network and get some output. We then calculate the mean-square error against the marginal vector field for that sample. 

Remember, marginal vector field is:

$$
u_t^{\text{target}}(x) = \int u_t^{\text{target}}(x \vert z) \frac{p_t(x \vert z)p_{\text{data}}(z)}{p_t(x)}\text{d}z
$$

So all we have to do is take the MSE between the neural network's output and this, right? But a problem arises because this integral is intractable to compute. 

##### conditional flow matching loss
However, all is not lost because the authors of the original flow matching paper propose a tractable alternative: using the conditional vector field instead of the marginal vector field.

$$
\mathcal{L}_{\text{CFM}}(\theta) = \mathbb{E}_{t \sim \mathcal{U}[0,1], z \sim p_{\text{data}}, x \sim p_t(\cdot \vert z)} [ \| u_t^\theta(x) - u_t^{\text{target}}(x \vert z)\|^2 ]
$$

Since the conditional vector field is tractable to compute, training a model with this loss is feasible. However, does swapping in the conditional vector field make sense? After all, we want to learn the marginal vector field. Luckily, it has been shown that $$\mathcal{L}_{\text{FM}}(\theta) = \mathcal{L}_{\text{CFM}}(\theta) +C$$, meaning that up to a constant, the losses are the same. In other words:

$$
\nabla_\theta \mathcal{L}_{\text{FM}}(\theta) = \nabla_\theta \mathcal{L}_{\text{CFM}}(\theta)
$$

Therefore, minimizing the CFM loss is equivalent to minimizing the intractable FM loss. This result allows us to train a neural network using conditional samples, while learning the marginal flow that transports the entire data distribution.

##### proof
Let's show that the flow matching loss is equal to the conditional flow matching loss up to a constant. In other words, $$\mathcal{L}_{\text{FM}}(\theta) = \mathcal{L}_{\text{CFM}}(\theta) +C$$.[^1]

###### part 1
$$
\mathcal{L}_{\text{FM}}(\theta) = \mathbb{E}_{t \sim \mathcal{U}[0,1], x \sim p_t} [ \| u_t^\theta(x) - u_t^{\text{target}}(x)\|^2  ]
$$

Since $$\| a-b \| ^2 = \|a\|^2 - 2a^Tb + \|b\|^2$$, we rewrite as:

$$
\mathcal{L}_{\text{FM}}(\theta) = \mathbb{E}_{t \sim \mathcal{U}[0,1], x \sim p_t} [ \| u_t^\theta(x)\|^2 - 2u_t^\theta(x)^Tu_t^{\text{target}}(x)+ \|u_t^{\text{target}}(x)\|^2  ]
$$

Now we can separate each term with the expectation:

$$
\mathcal{L}_{\text{FM}}(\theta) = \mathbb{E}_{t \sim \mathcal{U}[0,1], x \sim p_t} [ \| u_t^\theta(x)\|^2 ] 

- 2 \mathbb{E}_{t \sim \mathcal{U}[0,1], x \sim p_t} [u_t^\theta(x)^Tu_t^{\text{target}}(x)] + \mathbb{E}_{t \sim \mathcal{U}[0,1], x \sim p_t}[\|u_t^{\text{target}}(x)\|^2  ]
$$

Since the last term does not depend on $$\theta$$, we set it to be a constant, $$C_1$$:

$$
\mathcal{L}_{\text{FM}}(\theta) = \mathbb{E}_{t \sim \mathcal{U}[0,1], x \sim p_t} [ \| u_t^\theta(x)\|^2 ] 
- 2 \mathbb{E}_{t \sim \mathcal{U}[0,1], x \sim p_t} [u_t^\theta(x)^Tu_t^{\text{target}}(x)] + C_1
$$

###### part 2
Let's look at the second summand, $$\mathbb{E}_{t \sim \mathcal{U}[0,1], x \sim p_t} [u_t^\theta(x)^Tu_t^{\text{target}}(x)]$$, by itself.

We want to leverage the fact that any expectation can be written as an integral.

$$
\mathbb{E}_{t \sim \mathcal{U}[0,1], x \sim p_t} [u_t^\theta(x)^Tu_t^{\text{target}}(x)] = \int_0^1 \int p_t(x) p(t) u_t^\theta(x)^Tu_t^{\text{target}}(x) \text{d}x\text{d}t
$$

Since $$t \sim \mathcal{U}[0,1]$$, $$p(t) = 1$$ for $$t \in [0,1]$$, simplifying down to:

$$
= \int_0^1 \int p_t(x) u_t^\theta(x)^Tu_t^{\text{target}}(x) \text{d}x\text{d}t
$$

Next, we plug in the equation for the marginal vector field for $$u_t^{\text{target}}(x)$$.

$$
= \int_0^1 \int p_t(x) u_t^\theta(x)^T \left[ \int u_t^{\text{target}}(x \vert z) \frac{p_t(x \vert z)p_{\text{data}}(z)}{p_t(x)}\text{d}z \right] \text{d}x\text{d}t
$$
 
Using the linearity of integrals, we move the integral out and cancel out the two $$p_t(x)$$.

$$
= \int_0^1 \int \int u_t^\theta(x)^T u_t^{\text{target}}(x \vert z) p_t(x \vert z)p_{\text{data}}(z) \text{d}z \text{d}x\text{d}t
$$

Lastly, we can convert the integrals back to expectations:

$$
= \mathbb{E}_{t \sim \mathcal{U}[0,1], z \sim p_{\text{data}},x\sim p_t(\cdot\vert z)} [u_t^\theta(x)^T u_t^{\text{target}}(x \vert z)]
$$

###### part 3
Now let's plug the expectation back into the equation from part 1.

$$
\mathcal{L}_{\text{FM}}(\theta) = \mathbb{E}_{t \sim \mathcal{U}[0,1], x \sim p_t} [ \| u_t^\theta(x)\|^2 ] 
- 2\mathbb{E}_{t \sim \mathcal{U}[0,1], z \sim p_{\text{data}},x\sim p_t(\cdot\vert z)} [u_t^\theta(x)^T u_t^{\text{target}}(x \vert z)] + C_1
$$

Note, $$x\sim p_t$$ is equivalent to $$z\sim p_{\text{data}}, x \sim p_t(\cdot \vert z)$$. So we can combine the two expectations:

$$
= \mathbb{E}_{t \sim \mathcal{U}[0,1], z\sim p_{\text{data}} x \sim p_t(\cdot \vert z)} \left[ \| u_t^\theta(x)\|^2 
- 2u_t^\theta(x)^T u_t^{\text{target}}(x \vert z)\right] + C_1
$$

Let's add and subtract $$\|u_t^\text{target}(x\vert z) \|^2$$ inside the expectation:

$$
= \mathbb{E}_{t \sim \mathcal{U}[0,1], z\sim p_{\text{data}} x \sim p_t(\cdot \vert z)} \left[ \| u_t^\theta(x)\|^2 
- 2u_t^\theta(x)^T u_t^{\text{target}}(x \vert z)+ \|u_t^\text{target}(x\vert z) \|^2 - \|u_t^\text{target}(x\vert z) \|^2\right] + C_1
$$

Using the $$\| a-b \| ^2 = \|a\|^2 - 2a^Tb + \|b\|^2$$ in reverse this time, we get:

$$
= \mathbb{E}_{t \sim \mathcal{U}[0,1], z\sim p_{\text{data}} x \sim p_t(\cdot \vert z)} \left[ \|u_t^{\theta}(x) - u_t(x\vert z) \|^2 - \|u_t^\text{target}(x\vert z) \|^2\right] + C_1
$$

Let's rearrange a little:

$$
\mathcal{L}_{\text{FM}}(\theta)= \mathbb{E}_{t \sim \mathcal{U}[0,1], z\sim p_{\text{data}} x \sim p_t(\cdot \vert z)} [ \|u_t^{\theta}(x) - u_t(x\vert z) \|^2] +  \mathbb{E}_{t \sim \mathcal{U}[0,1], z\sim p_{\text{data}} x \sim p_t(\cdot \vert z)}[-\|u_t^\text{target}(x\vert z) \|^2] + C_1
$$

Again, we see the second expectation term, does not depend on $$\theta$$, so we can set $$\mathbb{E}_{t \sim \mathcal{U}[0,1], z\sim p_{\text{data}} x \sim p_t(\cdot \vert z)}[-\|u_t^\text{target}(x\vert z) \|^2] = C_2$$. Resulting in:

$$
\mathcal{L}_{\text{FM}}(\theta)= \mathbb{E}_{t \sim \mathcal{U}[0,1], z\sim p_{\text{data}} x \sim p_t(\cdot \vert z)} [ \|u_t^{\theta}(x) - u_t(x\vert z) \|^2] +  C_2 + C_1
$$

Given that $$\mathcal{L}_{\text{CFM}}(\theta) = \mathbb{E}_{t \sim \mathcal{U}[0,1], z \sim p_{\text{data}}, x \sim p_t(\cdot \vert z)} [ \| u_t^\theta(x) - u_t^{\text{target}}(x \vert z)\|^2 ]$$, we can now confidently say that:

$$
\begin{aligned}
\mathcal{L}_{\text{FM}}(\theta) &= \mathcal{L}_{\text{CFM}}(\theta) + C_2 + C_1\\

&= \mathcal{L}_{\text{CFM}}(\theta) + C
\end{aligned}
$$

#### conclusion

We now see that although the original flow matching loss is intractable to compute and training a neural network infeasible, the conditional flow matching objective remarkably results in the same gradients. The next thing I will look into is how the related diffusion and score matching frameworks address generative modeling.

---
{: data-content="footnotes"}
[^1]: This is me just going through and making sure I understand the proof laid out [here](https://arxiv.org/pdf/2506.02070). Again, this is probably the best introduction to flow mathcing anyone could have asked for.