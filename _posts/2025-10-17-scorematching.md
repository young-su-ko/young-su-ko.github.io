---
layout: post
category: concepts
title: score matching
---

We can extend flow matching, which uses ODEs, to score matching, which instead uses stochastic differential equations (SDEs).

 <!-- While flow matching learns *where mass flows*, score matching learns *how probability density spreads*. -->


#### what is score?
The score is the gradient of the log of the probability density:

$$
s(x) = \nabla_x \log p(x)
$$

#### marginal score
The marginal score of the probability path, $$p_t$$ is $$\nabla_x\log p_t(x)$$. We can express the marginal score with the conditional score. Note, $$\nabla_x$$ is shortened to $$\nabla$$.

Using the chain rule, we can re-write the marginal score as[^1]:

$$
\nabla \log p_t(x) = \frac{1}{p_t(x)} \nabla p_t(x) = \frac{\nabla p_t(x)}{p_t(x)}
$$

Since $$p_t(x) = \int p_t(x \vert z) p_\text{data}(z)\text{d}z$$:

$$
\nabla \log p_t(x) = \frac{\nabla \int p_t(x \vert z) p_\text{data}(z)\text{d}z}{p_t(x)}
$$

We can pull the gradient inside the integral to get:

$$
\nabla \log p_t(x) = \frac{\int \nabla p_t(x \vert z) p_\text{data}(z)\text{d}z}{p_t(x)}
$$

Using the log chain rule again on $\nabla \log p_t(x \vert z)$, we have 

$$
\nabla p_t(x\vert z) = p_t(x\vert z)\nabla\log p_t(x\vert z),
$$

which we can plug in (remember the gradient is with respect to $x$) to get:

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

##### sde
A stochastic differential equation (SDE) extends the ODE by adding a stochastic term:

$$
\text{d}X_t = u_t^\theta(X_t)\text{d}t + \sigma_t \text{d}W_t
$$

Where $W_t$ is Brownian motion and $\sigma_t$ is the diffusion coefficient controlling the strength of stochasticity over time.

##### sde extension trick
Given a conditional and marginal vector field for a given probability path, we can construct an SDE with a diffusion coefficient $\sigma_t \geq 0$ with the same probability path:

$$
X_0 \sim p_\text{init}, \quad \text{d}X_t = [u_t^\text{target}(X_t) + \frac{\sigma_t^2}{2} \nabla\log p_t(X_t)]\text{d}t + \sigma_t\text{d}W_t
$$

Here, $X_t \sim p_t$ for $t \in [0,1]$ and $X_1 \sim p_\text{data}$. This holds even if we use the conditional vector field and conditional probability path.

##### sde extension proof

The Fokker-Planck equation is used to prove that the SDE produces the same probability path. First, we define the Laplacian operator $\Delta$:

$$
\Delta w_t(x) = \sum_{i=1}^{d} \frac{\partial^2}{\partial^2x_i}w_t(x) = \text{div}(\nabla w_t)(x)
$$

If we have probability path $p_t$ and the SDE $X_0 \sim p_\text{init}$ and $\text{d}X_t = u_t^\theta(X_t)\text{d}t + \sigma_t \text{d}W_t$, $X_t$ has the follows $p_t$ for all $0 \leq t \leq 1$ if the Fokker-Planck equation holds:

$$
\partial_t p_t(x) = -\text{div}(p_t u_t)(x) + \frac{\sigma^2_t}{2}\nabla p_t(x) \quad \text{for all } x \in \mathbb{R}^d, 0 \leq t \leq 1.
$$



---
{: data-content="footnotes"}
[^1]: Note, if we rearrange the equation above, we get $\nabla p_t(x) = p_t(x)\nabla\log p_t(x)$\