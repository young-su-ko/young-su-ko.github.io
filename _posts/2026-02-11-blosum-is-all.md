---
layout: post
category: concepts
title: blosum is all you learn (in progress)
---

Here are notes from the paper: [BLOSUM Is All You Learn: Generative Antibody Models Reflect Evolutionary Priors](https://www.biorxiv.org/content/10.1101/2025.10.26.684652).

#### BLOSUM

What is the Blocks Substitution Matrix (BLOSUM)[^1]? First, imagine we have two protein sequences, could we quantify how similar the two sequences are? We could align sequences and count the mismatches (Hamming distance). However, a downside to this is we treat all amino acids substitutions equally. But imagine a protein that has a crucial positively charged amino acid at position 10. Intuitively, we would say that protein A, which has a different positively charged amino acid at position 10 is more similar than protein B, which has a non-polar amino acid at position 10. In other words, within the biological context of proteins, not all substitutions are equal.

To define a comprehensive map of likely vs non-likely substitutions, Henikoff and Henikoff created the BLOSUM62 substitution matrix (see below). We can see its a matrix of numbers, but what do they mean and where do they come from?

<center><img src="{{ site.baseurl }}/assets/img/blosum.svg" alt="drawing" width="50%" style="padding-bottom: 15px;"/></center>


##### Creating the BLOSUM matrix
The BLOCKS database[^2] contains ungapped alignments of short conserved regions (referred to as blocks) of protein families. Simply put, imagine each block as a list of $N$ aligned sequences, and the database composed of $K$ blocks. Across all blocks, we can calculate the frequency of two residues appearing together. For example, let's say we have the following sequences in a block:

```text
Seq 1: MKWRK...
Seq 2: MLWDL...
```

We can count up the number of aligned pairs: `MM=1, KL=2, WW=1, RD=1, ...`. Now do this for all residue pairs across sequences for each column, and then for every block. Once we have counted all pairs, we can calculate the probability of seeing the residues $a$ and $b$ together:

$$
P_\text{obs}(A,B) =  \frac{\# \text{obs}(A,B)}{\# \text{pairs}}
$$

We are interested in how much more likely a substitution is compared to random chance. To measure this, we can divide by $P(A)$ and $P(B)$. This would just be the number of times we observed the amino acid divided by the total amino acids seen.

If we take the log of this ratio, we get a log odds, or the BLOSUM score:

$$
S(A,B) = \frac{1}{\lambda} \log \frac{P_\text{obs}(A,B)}{P(A)P(B)}
$$

where $\lambda$ is a scaling factor that allows us to round to integer values. If $P(A,B) > P(A)P(B)$, then the score is positive, otherwise it is negative. 

The numbers on the matrix should make more sense now. The diagonal entries are larger, since they come from conserved sequences. You also see that `W-W` (11) has a higher value than `L-L` (4), although there were more paired-L occurences. This is because `W` is rarer, and $P(A)P(B)$ was a much smaller denominator. 

##### BLOSUM 45 vs 62 vs 80
Sequences in a block may have high sequence identity and can be clustered together at various thresholds (e.g. 45%, 62% or 80%) to reduce bias in the statistics. This is where the different BLOSUM matrices comes from. 

More specifically, we cluster sequences within the blocks before counting up the number of occurences and calculating the BLOSUM scores. Using a threshold of 45% clusters proteins that are more than 45% identical, resulting in a substitution matrix that reflects longer evolutionary distances. The opposite can be said for a threshold of 80%.

#### Alignment with BLOSUM
In summary, based on observed data (BLOCKS), we understand how likely different amino acid subsitutions are. The BLOSUM matrix itself only scores individual substitutions. However, to compare two proteins, alignment algorithms use these scores to find the arrangement of amino acids and gaps to maximize the total score. For example, given these two sequences:

```text
Seq 1: MKW
Seq 2: MLDW
```

We see a gap could go in two positions in Seq 1: `M-KW` or `MK-W`, leading to a `K-D` pair or a `K-L` pair. In either case, we have `M-M`, `W-W`, and one gap. According to BLOSUM, `K-D`:-1 and `K-L`:-2, so we can see that using gap: `M-KW` gives a higher overall score, and would be the preferred alignment.


---
{: data-content="footnotes"}
[^1]: Information taken from this [primer](https://www.nature.com/articles/nbt0804-1035)
[^2]: [The Blocks Database—A System for Protein Classification](https://academic.oup.com/nar/article/24/1/197/2359962)