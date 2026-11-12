---
layout: post
title: "Weight-Space Programming"
author: Lalith Uriti
permalink: /blog/weight-space-programming/
date: 2026-11-08 17:14:04 -0500
date_has_time: true
---

Can a text-only model answer questions about an image if you give it one token made from pixels?

In [*Sparks of Weight-Space Programming*](https://rikiyat.github.io/blog/weight-space-programming/), Takehi and colleagues asked an LLM to inspect and edit neural network weights directly. I tried a smaller experiment on my Mac. Could an LLM design a connector between two pretrained models?

## One image, one token

SigLIP 2 turns an image into a vector. A small connector projects that vector into Qwen3’s input space, where it becomes one *soft token* alongside the question. Both models stayed frozen. I fit only the connector, using 40 labeled images and no gradient updates.

![An image passes through frozen SigLIP 2. A fitted linear connector turns its features into one soft token for frozen Qwen3, which picks an answer.]({{ '/assets/images/weight-space/connector.svg' | relative_url }})

GPT-6.1 Sol wrote a fitting procedure that downweighted variation within each class. GPT-6 Astra wrote a ridge regression procedure that picked its regularization strength using the calibration images. In both runs the LLM wrote the fitting code, and the code computed the connector weights.

## Did Qwen use the image?

I gave Qwen four answer choices per image. On the first 100 held-out CIFAR-10 images, Sol’s connector scored 74% and fixed ridge scored 76%. I then ran both connectors and the baseline on a fresh set of 100 images.

![Fresh test accuracy: native SigLIP 88%, Astra connector 81%, Sol connector 80%, fixed ridge 79%, no image 25%, wrong image 14%. Chance was 25%.]({{ '/assets/images/weight-space/results.svg' | relative_url }})

With Astra’s connector, swapping in the wrong image dropped accuracy from **81% to 14%**. The image was getting through. Astra’s one-point lead over Sol is too small to call on this sample, and SigLIP’s own image–text scoring still scored highest.

[Experiment code on GitHub](https://github.com/lalithu/cloud-assisted-model-stitching)

Yes. An LLM designed a connector that let frozen, text-only Qwen use one image-derived token to answer four-choice questions. It got **81 out of 100** right on fresh images, compared with **79 out of 100** for fixed ridge. That shows the connection worked on this task. The two-point gap is too small to establish that the LLM-designed connector was better. 

Next, I’d let the LLM try several connector designs, then test its best design against ridge on a fresh set of questions about what’s happening in each image.
