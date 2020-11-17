# TabTab

[![Run on Ainize](https://ainize.ai/images/run_on_ainize_button.svg)](https://ainize.web.app/redirect?git_repo=https://github.com/ainize-team/tabtab)

A smart machine that completes your thoughts.

![image](https://user-images.githubusercontent.com/42924998/99344161-c3e8f700-28d2-11eb-8162-4e50833c62b6.png)

Using the GPT-2 model, you can create such an editor or create a variety of things.

## Docker build
```
docker build -t $(YOUR_DOCKER_HUB_ID)/tabtab .
```

## Docker run
```
docker run -p 80:80 -d $(YOUR_DORCKER_HUB_ID)/tabtab
```
Now the server is available at http://localhost.

## How to use it?
Select a theme, Write your text in a text editor.

If you can't come up with something to write while writing, press the Tab button to get recommendations.

Select the Short button if you want to recommend a few words, or the long button if you want a long sentence without an idea at all.

Select the appropriate sentence with the mouse or press Enter to decide.

# GPT2-Model List
GPT2-Large: https://ainize.ai/Jeong-Hyun-Su/gpt2-large

GPT2-Cover-Letter: https://ainize.ai/Jeong-Hyun-Su/gpt2-cover-letter

GPT2-Reddit: https://ainize.ai/woomurf/gpt2-reddit

GPT2-Story: https://ainize.ai/gmlee329/gpt2_story

GPT2-Ads: https://ainize.ai/psi1104/gpt2-ads

GPT2-Film: https://ainize.ai/gmlee329/gpt2_film

GPT2-Trump: https://ainize.ai/gmlee329/gpt2_trump

GPT2-Debate: https://ainize.ai/gmlee329/gpt2_debate

GPT2-Business: https://ainize.ai/leesangha/gpt2-business

## How to develop TabTab on Ainize (with GPT-2 APIs)

https://ai-network.gitbook.io/ainize-tutorials/
