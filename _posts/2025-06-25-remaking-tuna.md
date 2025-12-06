---
layout: post
category: projects
title: refactoring TUnA (i)
---

#### i want to write clean code
Before my PhD, my experience with writing code was limited to stitching together a few Python scripts to automate an AutoDock-Vina pipeline. Back then, I only saw coding as a tool to help me get my results faster.

It wasn't until I started my PhD I learned about clean code and that coding is an artform. While I **tried** to write clean code, I still have a ways to go. I always want to to better my code/engineering--I realized it would be a good challenge to take some of my old projects and see how I can improve it, starting with my first PhD project, TUnA.

##### what is TUnA?
TUnA[^1], is a transformer-based method for predicting protein-protein interactions (PPI) from sequence alone. In short, TUnA uses a combination of ESM2 embeddings, a Transformer block, and a Gaussian Process layer to output a binary label. I'll discuss my thoughts on the field of PPI prediction later[^2], but this post is focused solely on the engineering aspect.

##### what's wrong with the current repo?
My philosophy for this project was that the repo should just be for users trying to reproduce the results of the paper. You can see how this is reflected in the structure of the repo.

The main code is stored in `/results`. Inside, we branch into two benchmark datasets. We benchmarked TUnA with 3 ablated models, so for each dataset, we have directories for each model type. Within each model directory, we have the config, training loop, utils, and inference code.

So even for reproducing the results, you have to navigate to a specific model's subdirectory, and run `train.py` from within. Each directory is essentially a controlled "experiment" that can be reproduced.

The downside to this is that a lot of the code is repeated and it's unclear how to actually use TUnA to make predictions. Although reproduciblity is still important, I realized that as a methods paper, it's equally as important to write code that makes it easy to **use** your method.

##### so let's fix it!
My goal is to set up a new repo that allows:
1. Reproduction of the results (training)
2. Easy use of trained models (e.g. fine-tune, inference)

##### reproducing results
Instead of having to navigate to every subdirectory and running training, I want everything to be run from the project root. A `/src` directory will contain the code for the different models. A config file will allow users to specify which model and dataset they want to run, as well as control hyperparameters. 

Since we trained ablated models, I want to create a unified model class that will let the users decide which model component to include for additional streamlining.

I've only recently started using PyTorch Lightning and I've really been enjoying the quality of life improvements it provides. So needless to say, I'll be using Lightning, logging with WandB, and config/hyperparameter management with Hydra (shoutout to Kapil for introducing me to this). 

##### improving usability
About two months ago, someone asked me about how TUnA can be actually used for inference[^3]. As I was explaning to them all the different steps to take, I realized it was too complicated, at the end of the day, users should just be able to put in two protein sequences and get a prediction. 

So I'm imagining a command-line interface where users can either pass in two protein sequences or pass in a csv file for batch predictions.

Currently, generating ESM2 embeddings, used as inputs to TUnA, is treated as a pre-processing step, that users must run before using TUnA. For inference and ease of use, I will need to set up code so that users can simply pass in an amino acid sequence and the embeddings will be generated on the fly. This removes an additional step and more importantly **removes user friction**.

#### lets implement these changes
I've already started the new repo, which I named [TUnA-R](https://github.com/young-su-ko/TUnA-R). As I clean the code and add in these new features, I'll document any new issues I run into and how I resolved them. Lastly, I'm going to use uv[^4] for package management, because that's another new technology I want to get familiar with.

---
{: data-content="footnotes"}
[^1]: [TUnA: an uncertainty-aware transformer model for sequence-based protein–protein interaction prediction](https://academic.oup.com/bib/article/25/5/bbae359/7720609)
[^2]: TUnA did not solve the PPI prediction problem. Although we got good results for a benchmark measuring generalizability to unseen PPIs, a majority of the heavy lifting is achieved by ESM2 embeddings. This raises the question of how to design a model architecture that can better extract the necessary info from the embeddings, for further improved generalizability.
[^3]: Thanks [wangxinfeng-w](https://github.com/Wang-lab-UCSD/TUnA/issues/1) for raising the first issue on my repo!
[^4]: Resolving dependencies in conda envs can take literal hours and [uv](https://docs.astral.sh/uv/) is gaining a lot of popularity.