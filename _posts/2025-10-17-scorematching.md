---
layout: post
category: concepts
title: score matching
---

We can extend flow matching, which uses ODEs, to score matching, which instead uses stochastic differential equations (SDEs). While flow matching learns *where mass flows*, score matching learns *how probability density spreads*.


#### what is score?
The score is the gradient of the log of the probability density:

$$
s(x) = \nabla_x \log p(x)
$$

#### marginal score
The marginal score of the probability path, $$p_t$$ is $$\nabla_x\log p_t(x)$$. We can express the marginal score with the conditional score. Note, $$\nabla_x$$ is shortened to $$\nabla$$.

Using the chain rule, we can re-write the marginal score as:

$$
\nabla \log p_t(x) = \frac{\nabla p_t(x)}{p_t(x)}
$$

Note, if we rearrange the equation above, we get:

$$
\nabla p_t(x) = p_t(x)\nabla\log p_t(x)
$$

Since $$p_t(x) = \int p_t(x \vert z) p_\text{data}(z)\text{d}z$$:

$$
\nabla \log p_t(x) = \frac{\nabla \int p_t(x \vert z) p_\text{data}(z)\text{d}z}{p_t(x)}
$$

We can pull the gradient inside the integral to get:

$$
\nabla \log p_t(x) = \frac{\int \nabla p_t(x \vert z) p_\text{data}(z)\text{d}z}{p_t(x)}
$$

From the log chain rule, we have 

$$
\nabla p_t(x\vert z) = p_t(x\vert z)\nabla\log p_t(x\vert z),
$$

which we can plug in to get:

$$
\begin{aligned}
\nabla \log p_t(x) &= \frac{\int p_t(x\vert z)\nabla\log p_t(x\vert z) p_\text{data}(z)\text{d}z}{p_t(x)}\\
&= \int \nabla\log p_t(x\vert z) \frac{p_t(x\vert z) p_\text{data}(z)}{p_t(x)}\text{d}z
\end{aligned}
$$

where $$\nabla\log p_t(x\vert z)$$ is the conditional score.

##### conditional score for gaussian probability paths
Let's find the conditional score for the Gaussian path $$p_t(x \vert z) = \mathcal{N}(x; \alpha_tz, \beta_t^2I_d)$$.

$$
\begin{aligned}
\nabla_x \log p_t(x \vert z) &= \nabla_x \log \mathcal{N}(x; \alpha_tz, \beta_t^2I_d)\\
&= \nabla_x \log \frac{1}{\sqrt{2\pi\beta_t^2}}e^{-\frac{1}{2}(\frac{x-\alpha_tz}{\beta_t})^2}\\
&= \nabla_x \left[-\frac{1}{2}(\frac{x-\alpha_tz}{\beta_t})^2 - \log \sqrt{2\pi\beta_t^2} \right]\\
&= -\frac{x-\alpha_tz}{\beta_t^2}
\end{aligned}
$$

Like we show above, the conditional score can often be computed analytically, which is useful for expressing the marginal score.

##### sde extension trick
The conditional and marginal vector fields for ODEs can be used to define a SDE.