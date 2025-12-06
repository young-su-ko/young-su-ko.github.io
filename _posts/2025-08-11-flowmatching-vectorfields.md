---
layout: post
category: concepts
title: flow matching (vector fields)
---

Picking up from the previous discussion on [probability paths](flowmatching-probpaths.html), let's continue the exploration of flow matching.

#### vector fields
The goal of flow matching is to learn a vector field, $$u_t$$, that is able to transform a simple distribution into a desired data distribution. A vector field is said to define an ODE whose solution is a flow, $$\psi_t$$.

If the vector field is the GPS that tells you "in 50 feet, turn right", etc, the flow the route you end up taking following the GPS. 

For every datapoint $$z \in \mathbb{R}^d$$, $$u_t( \cdot \vert z)$$ denotes the **conditional vector field**.

To give an analogy, let $$x$$ be some starting point in San Diego, and $$z$$ be a destination you wish to reach. At each moment in time along our journey, the GPS, $$u_t(x \vert z)$$, will tell us how to move so that we end up at our destination.

So what's the equation for the conditional vector field? Let's find it in the case of Gaussian probability paths.

##### conditional gaussian vector field
We can construct a specific flow, one that exactly follows the Gaussian probability path:

$$
\psi_t(x \vert z) = \alpha_t z + \beta_t x
$$

In our case, we set our starting point to be:

$$
X_0 \sim p_\text{init} = \mathcal{N}(0,I_d)
$$

That means the ODE trajectory (our position given a timepoint), $$X_t$$, is given by:

$$
X_t = \psi_t(X_0 \vert z) = \alpha_t z + \beta_t X_0
$$

In other words, our trajectory matches our conditional probability path:

$$
X_t \sim \mathcal{N}(\alpha_tz, \beta_t^2I_d) = p_t(\cdot \vert z)
$$

We can compute the vector field from the flow by taking the time-derivative of the flow. Intuitively, this makes sense--in the 1-D physics case, the derivative of position is velocity. The vector field is just an extension of this idea in a higher dimension.

The vector field tells us the velocity at any given point, and the flow is defined so that its time derivative matches the vector field evaluated at the current position along the flow.

$$
\frac{\text{d}}{\text{d}t}\psi_t(x \vert z) = u_t(\psi_t(x\vert z) \vert z)
$$

$$
\Leftrightarrow \dot{\alpha}_tz + \dot{\beta}_tx = u_t(\alpha_t z + \beta_tx \vert z)
$$

Now, we can substitute our actual starting point $$x = X_0$$.

$$
\Leftrightarrow \dot{\alpha}_tz + \dot{\beta}_tX_0 = u_t(\alpha_t z + \beta_tX_0 \vert z)
$$

We make these two substitutions: 

$$
X_t = \alpha_t z + \beta_tX_0, \quad X_0 = \frac{X_t-\alpha_tz}{\beta_t}
$$

and rearrange.

$$
\Leftrightarrow \dot{\alpha}_tz + \dot{\beta}_t \frac{X_t - \alpha_tz}{\beta_t} = u_t(X_t \vert z)
$$

$$
\Leftrightarrow \left(\dot{\alpha}_t - \frac{\dot{\beta}_t}{\beta_t}\alpha_t \right)z + \frac{\dot{\beta}_t}{\beta_t}X_t = u_t(X_t \vert z)
$$

In other words, the conditional Gaussian vector field is given by the left-hand side for any valid noise schedulers $$\alpha$$ and $$\beta$$.


If $$\alpha=t$$ and $$\beta=1-t$$, we have a specific probability path referred to as the **Gaussian CondOT probability path**:

$$
p_t(x|z) = \mathcal{N}(tz, (1-t)^2I_d)
$$

In this case, it is easy to compute the derivative wrt time:

$$
\alpha_t = t, \dot{\alpha}_t = 1, \quad \beta_t=1-t, \dot{\beta}_t = -1
$$

The corresponding vector field is:

$$
u_t(x \vert z) = \left( 1 - \frac{-t}{1-t} \right)z + \frac{-1}{1-t}x
$$

$$
\Leftrightarrow \left( \frac{1-t}{1-t} - \frac{-t}{1-t} \right)z + \frac{-1}{1-t}x
$$

$$
\Leftrightarrow \frac{1}{1-t} z - \frac{1}{1-t}x
$$

$$
\Leftrightarrow \frac{z-x}{1-t}
$$

Substituting $$x=X_t$$ and $$X_0 = \epsilon$$, we see:

$$
\Leftrightarrow \frac{z-X_t}{1-t}
$$

$$
\Leftrightarrow \frac{z-(tz+(1-t)\epsilon)}{1-t}
$$

$$
\Leftrightarrow \frac{(1-t)z - (1-t)\epsilon}{1-t}
$$

$$
\Leftrightarrow z - \epsilon
$$

For the Gaussian CondOT path, the conditional vector field is simply:

$$
u_t(X_t \vert z) = z-\epsilon
$$

##### marginal vector field
The condition vector field describes how to transform noise into a single datapoint. However, we are interested in transforming entire distributions, which require us to learn the marginal vector field:

$$
u_t(x) = \int u_t(x \vert z) \frac{p_t(x \vert z) p_\text{data}(z)}{p_t(x)}\text{d}z
$$

One of my first thoughts was: why isn't the marginal vector field simply just:

$$
u_t(x) = \int u_t(x \vert z) p_{\text{data}}(z) \text{d}z
$$

Here, we are treating all datapoints equally, but the average velocity at a specific location should be influenced more heavily by datapoints that are nearby. In other words, we need to account for the probability a datapoint being present near our location.

Using the GPS analogy, let's say there are two groups of cars. One group is heading to LA, the other to Las Vegas, both starting from San Diego.

If our position $$x$$ is Irvine, a city close to LA, and we want the marginal vector field at Irvine. If we use $$p_{\text{data}}(z)$$, we consider all cars equally, even the ones headed to Las Vegas, pointing a whole different direction!

The marginal vector field, should therefore weight the conditional vector fields, by the proximity to the current position. Cars near Irvine are more important for the average direction than cars hundreds of miles away heading to Vegas.

More formally, what matters is not $$p_\text{data}(z)$$, but rather $$p_\text{data}(z \vert x,t)$$. Now, the contribution to the marginal vector field average is weighted by the probability of being in that position.

We can re-write $$p_\text{data}(z \vert x,t)$$ using Bayes' rule, which says $$P(A \vert B) = \frac{P(B \vert A) P(A)}{P(B)}$$.

$$
p(z \vert x,t) = \frac{p(x,t \vert z) p(z)}{p(x,t)} = \frac{p_t(x \vert z)p(z)}{p_t(x)}
$$

Now substituting $$p(z \vert x,t)$$ into integral above, we get the original:

$$
u_t(x) = \int u_t(x \vert z) \frac{p_t(x \vert z) p_\text{data}(z)}{p_t(x)}\text{d}z
$$

##### continuity equation
The continuity equation says:

$$
\partial_tp_t(x) = - \text{div}(p_tu_t^{\text{target}})(x) \quad \forall x \in \mathbb{R}^d, 0 \leq t\leq1
$$

$$\partial_tp_t(x)=\frac{\text{d}}{\text{d}t}p_t(x)$$, the time derivative of $$p_t(x)$$, and $$\text{div}$$ is the divergence operator.

What is the $$\text{div}$$ operator? 

$$
\text{div}(v_t)(x) = \sum_{i=1}^{d} \frac{\partial}{\partial x_i}v_t(x) 
$$

In other words, $$\text{div}(v_t)(x)$$ is the dot product of $$\nabla$$ and the vector field, and measures the net in/out flow at a given point.

Therefore, the continuity equation says: the rate of change of probability density at a point equals the negative of the net outflow there. If probability flows out of a point (**positive divergence**), the local **density decreases**. If probability flows in (**negative divergence**), the local **density increases**.

We now show that if each conditional flow conserves probability mass, then the marginal also does.

$$
\begin{aligned}
\partial_tp_t(x) &= \partial_t \int p_t(x \vert z)p_{\text{data}}(z) \text{d}z \\ 
&= \int \partial_t p_t(x \vert z)p_{\text{data}}(z) \text{d}z \\
&= \int -\text{div}(p_t (x\vert z)u_t^{\text{target}}(x \vert z))p_{\text{data}}(z) \text{d}z\\
&= -\text{div} \int \left(  p_t (x \vert z)u_t^{\text{target}}(x \vert z)p_{\text{data}}(z) \text{d}z    \right)\\
&= -\text{div} \left( p_t(x) \int u_t^{\text{target}}(x \vert z) \frac{p_t(x \vert z) p_\text{data}(z)}{p_t(x)}\text{d}z\right)(x)\\
&= -\text{div} (p_tu_t^{\text{target}})(x)
\end{aligned}
$$[^1]

To summarize the main point: if the conditional path for individual datapoints satisfies the continuity equation, if we look at the behavior of the paths across all datapoints (marginal vector field), it also satifies the continuity equation[^2]. 

#### summary
Since we can easily sample from a Gaussian, if we learn the marginal vector field, we can transform our samples from the Gaussian into a sample from our desired distribution. We've seen that the marginal vector field is a weighted average of conditional vector fields and that continuity equation holds true for the marginal vector field. Next, we will look into why the marginal vector field is hard to directly learn and how we get around it.

---
{: data-content="footnotes"}
[^1]: Applying the product rule at the last step: $$\text{div}(f\mathbf{v}) = \nabla \cdot f + f \cdot \text{div}(\mathbf{v})$$
[^2]: I think this is a reoccuring theme that comes up many times for flow matching: what works at the individual level, somehow also works over the entire dataset.