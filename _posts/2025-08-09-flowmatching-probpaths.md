---
layout: post
category: concepts
title: flow matching (probability paths)
---

I've been reading more in-depth about flow matching[^1], and trying to understand every part better. 

#### probability paths

One of the first key takeaways is the concept of the probability path, starting with the conditional probability path, written as $$p_t(\cdot\vert z)$$.

The conditional probability path describes how a *specific* single datapoint $$z$$ from the data distribution, $$p_{\text{data}}$$, transforms into the source distribution, $$p_{\text{init}}$$, as time moves from 0 to 1.

A probability path is like a collection of probability distributions, each distribution corresponding to different timepoints. So our position at each time point is described by these distributions.

An important point is that at $$t=0$$, we have $$p_0(\cdot \vert z) = p_{\text{init}}$$ and at $$t=1$$, we have $$p_1(\cdot \vert z) = \delta_z$$[^2]. This just means we will start at one distribution and end at another.

Here's an analogy: my location during the day. At 9AM, I am definitely at my office. At 1PM, I’m 80% likely to still be in the office, 20% likely to be at home. At 2AM, I am definitely in my bed, asleep. This is following the probability path for one specific person (conditional path).

If we take the conditional probability path and average it across all possible datapoints, we get the **marginal probability path**. This is like describing the location of *everyone on campus* at a given time.

$$
p_t(x) = \int p_t(x \vert z)p_{\text{data}}(z) \text{d}z
$$

You know I love my expectations, so if we re-write it as such, we have:

$$
p_t(x) = \mathbb{E}_{z \sim p_{\text{data}}}[p_t(x \vert z)]
$$

This tells us that to sample from the marginal probability path, we can sample a random datapoint, $$z\sim p_{\text{data}}$$, and then sample $$x_t \sim p_t(\cdot \vert z)$$.

##### gaussian conditional probability path
Denoising diffusion models use the Gaussian probability path. This means at every time point, the position is described by a Gaussian.

To construct the Gaussian path, we define two noise schedulers $$\alpha_t$$ and $$\beta_t$$. Then we define the conditional probability path as:

$$
p_t(\cdot \vert z) = \mathcal{N}(\alpha_t z, \beta_t^2 I_d)
$$

Because of the requirements we impose[^3] on $$\alpha_t$$ and $$\beta_t$$:

At $$t=0$$:

$$
p_0(\cdot \vert z) = \mathcal{N}(0, I_d) = p_{\text{init}}
$$

And at $$t=1$$:

$$
p_1(\cdot \vert z) = \mathcal{N}(z, 0) = \delta_z
$$

So the Gaussian path is a valid probability path. Now what about sampling from the path?

##### reparameterization trick
We can write $$p_t(\cdot \vert z) = \mathcal{N}(\alpha_t z, \beta_t^2 I_d)$$ as $$p_t(\cdot \vert z) = \alpha_t z + \beta_t \epsilon$$, where $$\epsilon \sim \mathcal{N}(0, I_d)$$.

I had to convince myself that this is a valid reparameterization.

Lets say we have two random variables: $$X \sim \mathcal{N}(\alpha_t z, \beta_t^2 I_d)$$ and $$Y = \alpha_t z + \beta_t \epsilon$$.

First, is $$Y$$ a Gaussian? Since we are taking $$\epsilon$$, which is Gaussian, scaling by $$\beta_t$$, then shifting by $$\alpha_t z$$, $$Y$$ is still Gaussian.

Since $$X$$ and $$Y$$ are both Gaussian, if we show they have the same mean and covariance, we can show they are equal in distribution. This is because Gaussians are fully described by their first and second moments.

First let's find $$\mathbb{E}[X]$$ and $$\text{Cov}(X)$$. This is simple since $$X \sim \mathcal{N}(\alpha_t z, \beta_t^2 I_d)$$.

$$
\mathbb{E}[X]=\alpha_t z \quad \quad \text{Cov}(X) = \beta_t^2I_d
$$

Now for $$Y$$.

$$
\mathbb{E}[Y] = \mathbb{E}[\alpha_t z +\beta_t \epsilon] = \mathbb{E}[\alpha_t z] + \mathbb{E}[\beta_t \epsilon]
$$

Since $$\alpha_t z$$ is not a random variable, the expectation is just itself. If we pull $$\beta_t$$ out, we have $$\beta_t \mathbb{E}[\epsilon]$$, which is just $$\beta_t(0)=0$$, since $$\epsilon \sim \mathcal{N}(0,I_d)$$.

So the means are the same:

$$
\mathbb{E}[Y] = \alpha_t z + 0 = \alpha_t z = \mathbb{E}[X]
$$

What about covariance? 

$$
\text{Cov}(Y) = \text{Cov}[\alpha_t z +\beta_t \epsilon] = \text{Cov}[\alpha_t z] + \text{Cov}[\beta_t \epsilon]
$$

Since $$\alpha_t z$$ is a constant, its covariance is 0. We can pull $$\beta_t$$ out, remembering it turns in to $$\beta_t^2$$. And lastly, $$\text{Cov}[\epsilon]=I_d$$.

So the covariances are also the same:

$$
\text{Cov}(Y) = 0 + \beta_t^2I_d = \beta_t^2I_d = \text{Cov}(X)
$$

Since $$X$$ and $$Y$$ are both Gaussian, and have the same mean and covariance, 

$$
X \stackrel{d}{=} Y
$$

meaning we can sample from the $$Y$$ whenever we need $$X$$, simplifying the sampling process.

##### sidenote on VAEs

This is just like the reparameterization trick in variational autoencoders, you know the trick that allows gradients to flow back through the network. First is what happens without the trick:

```python
mean, variance = encoder(input)
z = torch.normal(mean, sqrt(variance))
output = decoder(z)

loss = mse_loss(input, output)
```
The issue is that we can't backprop through `torch.normal()`. But with the trick, we are able to backprop through the encoder:

```python
mean, variance = encoder(input)
eps = torch.randn_like(mean)
z = mean + sqrt(variance)*eps
output = decoder(z)

loss = mse_loss(input, output)
```


---
{: data-content="footnotes"}
[^1]: Again, [this resource](https://diffusion.csail.mit.edu/docs/lecture-notes.pdf) is quite amazing.
[^2]: $$\delta_z$$ refers to the Dirac delta distribution, a distribution that always gives us $$z$$. This kind of seems like a way for us to have something that has 100% probability, but still define it as a distribution.
[^3]: The requirement is that both $$\alpha_t$$ and $$\beta_t$$ have to be continously differentiable and monotonic. And $$\alpha_0=\beta_1=0$$ and $$\alpha_1=\beta_0=1$$.