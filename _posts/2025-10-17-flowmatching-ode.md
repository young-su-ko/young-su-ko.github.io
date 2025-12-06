---
layout: post
category: concepts
title: flow matching (simulation)
---

Finally, we can see how the vector field we train with flow matching can be used to generate a sample from our desired distribution.

#### ordinary differential equations (ODEs)
An ODE describes how something changes with respect to time. To solve an ODE means to know the value of that something (here, it is **position**) at any given timepoint. In other words, we know a function $$X_t$$ that describes the position at any t--this function is called the **trajectory**, which has the form[^1]:

$$
X: [0,1] \rightarrow \mathbb{R}^d, \quad t \mapsto X_t
$$



Every ODE is defined by a **vector field** $$u$$, a function with the form[^2]:

$$
u: \mathbb{R}^d \times [0,1] \rightarrow \mathbb{R}^d, \quad (x,t) \mapsto u_t(x)
$$

We have the following relationship between the trajectory and the vector field:

$$
\frac{\text{d}}{\text{d}t}X_t = u_t(X_t)
$$

In other words, the change in the position will be the instaneous velocity at that position.

Given some initial point of a trajectory $$X_0=x_0$$ and $$t=0$$, we want to know $$X_t$$. In other words, we want the trajectory for any possible starting point--this function is called the flow[^3]:

$$
\psi: \mathbb{R}^d \times [0,1] \mapsto \mathbb{R}^d, \quad (x_0,t) \mapsto \psi_t(x_0)
$$

In other words,

$$
\frac{\text{d}}{\text{d}t}\psi_t(x_0) = u_t(\psi_t(x_0)), \quad \psi_0(x_0) = x_0
$$

##### simulating the ODE
Directly computing the flow is tricky if the vector field is not very simple. Instead, numerical methods like the Euler method [^4] allow us to brute force the solution.

$$
X_{(t+h)} = X_t + hu_t(X_t),
$$

where $$h$$ is a controllable step size. The Euler method is intuitive because it tells us, to find the next position $$X_{(t+h)}$$, compute the instantaneous velocity, $$u_t(X_t)$$, scale it by the step size, and add it to the current position. Using a smaller step size leads to a more accurate simulation.

##### generating samples with a flow model
Previously, we showed how the conditional flow matching loss is used to train a neural network $$u_t^{\theta}$$ to match the marginal vector field.

To generate new samples, we simply simulate the ODE of our learned vector field using the Euler method:

$$
X_{(t+h)} = X_t + hu_t^\theta(X_t),
$$

For our starting point, we sample from our simple distribution, $$X_0 \sim \mathcal{N}(0, I_d)$$, and repeatedly apply the update from $$t = 0$$ to $$t = 1$$. Again, the number of updates depends on the step size $$h$$. The final value, $$X_1$$, is a sample from our desired data distribution.




---
{: data-content="footnotes"}
[^1]: $$X$$ takes a time from [0,1] and outputs a position vector $$X_t$$ in $$d$$-dimensional space.
[^2]: For every position and time, $$u$$ outputs a velocity vector in $$d$$-dimensional space.
[^3]: A flow tells us the position at time $$t$$ for the trajectory that starts at $$x_0$$. In otherwords, a function that describes the full trajectory for any arbitrary starting point.
[^4]: The Euler method is the simplest solver and more complicated ones can be faster / more stable, but they can be ignored for now.