# TabTab
It is a service that allows you to experience various gpt2 models through the editor.

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

f you can't come up with something to write while writing, press the Tab button to get recommendations.

Select the Short button if you want to recommend a few words, or the long button if you want a long sentence without an idea at all.

Select the appropriate sentence with the mouse or press Enter to decide.


## How to develop TabTab on Ainize (with GPT-2 APIs)

https://ai-network.gitbook.io/ainize-tutorials/