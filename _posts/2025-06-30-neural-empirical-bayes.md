---
layout: post
category: concepts
title: neural empirical bayes (in progress)
---

I was reading about [Discrete Walk-Jump Sampling](https://arxiv.org/pdf/2306.12360) and noticed it builds upon neural empirical Bayes (NEB). Also, I want to train myself to not be intimidated by arxiv papers with a bunch of mathematical notation[^1].

#### introduction
The paper states NEB unifies kernel density estimation (KDE)[^2] and empirical Bayes.

##### kde
Given some PDF $$f_X$$ we want to estimate, KDE with a Gaussian kernel and bandwidth $$\sigma$$ estimates the smoothed density:

$$
f_Y = f_X * N(0, \sigma^2I_d)
$$

Which is the distribution of the random variable:

$$
Y = X + N(0,\sigma^2I_d)
$$

So, the KDE gives us $$\hat{f} \approx f_Y$$. This setup is denoted as $$X\rightharpoonup Y$$.

##### manifold disintegration
>Assume that the random variable $$X$$ in high dimensions is concentrated on a low-dimensional manifold $$\mathscr{M}$$, and denote the manifold where the random variable $$Y= X+N(0,\sigma^2 I_d)$$ is concentrated as $$\mathscr{N}$$. We are interested in formalizing the hypothesis that as $$d \rightarrow \infty$$, the convolution of $$f_X$$ and $$f_N$$ (for any $$\sigma$$) would disintegrate $$\mathscr{M}$$ such that $$\text{dim}(\mathscr{N})\gg \text{dim}(\mathscr{M})$$

I think I understand this. If $$X$$ corresponds to 100x100 pixel images, real images will live on a smaller portion of this 100x100 dimension space, referred to here as $$\mathscr{M}$$, since real images have patterns and structure. The full 100x100 space includes mostly random noise. By adding noise, we push real data off $$\mathscr{M}$$ to the larger, more disorganized manifold $$\mathscr{N}$$. 


---
{: data-content="footnotes"}
[^1]: Even though the point of these symbols is to compress what takes a lot of words to explain down to a few characters, I feel cognitively "lazy" reading equations. This is the same feeling I get trying to read in Japanese--it takes more mental effort to decode/understand the meaning, so I end up getting really impatient and frustrated. But a philosophy I'm trying to embrace is that if it's making me uncomfortable, it *usually* means I'm heading in the right direction.
[^2]: My notes on KDE are [here](kde.html).
