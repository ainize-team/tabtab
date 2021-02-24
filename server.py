from flask import Flask, request, Response, render_template, jsonify
import requests
import time
import random
import json

from transformers import AutoTokenizer

autoTokenizer = AutoTokenizer.from_pretrained("gpt2-large")

# Server & Handling Setting
app = Flask(__name__, static_url_path='/static')

models = {
    "gpt2-large": "http://main-gpt2-large-jeong-hyun-su.endpoint.ainize.ai/",
    "gpt2-cover-letter": "http://main-gpt2-cover-letter-jeong-hyun-su.endpoint.ainize.ai/",
    "gpt2-story": "http://main-gpt2-story-gmlee329.endpoint.ainize.ai/",
    "gpt2-reddit": "https://master-gpt2-reddit-woomurf.endpoint.ainize.ai/",
    "gpt2-trump": "http://main-gpt2-trump-gmlee329.endpoint.ainize.ai/"
}


@app.route("/url", methods=['POST'])
def gpt2_url():
    try:
        context = request.form['context']
        model_url = request.form['model']
        print(model_url)
    except Exception:
        print("Empty Text")
        return Response("fail", status=400)

    encodedText = autoTokenizer.encode(context)

    headers = {'Content-Type': 'application/json; charset=utf-8'}
    data = {"text": encodedText, "num_samples": 5, "length": 20}
    response = requests.post(model_url, headers=headers, data=json.dumps(data))
    if response.status_code == 200:
        result = dict()
        # print(result)
        res = response.json()
        for idx, sampleOutput in enumerate(res):
            result[idx] = autoTokenizer.decode(
                sampleOutput, skip_special_tokens=True)[len(context) + 1:]
        return result

    else:
        return jsonify({'fail': 'error'}), response.status_code


@app.route("/gpt2", methods=['POST'])
def gpt2():
    try:
        context = request.form['context']
        model = request.form['model']
        length = request.form['length']

    except Exception:
        print("Empty Text")
        return Response("fail", status=400)

    url = models[model] + model + "/long"

    if length == 'short':
        times = random.randrange(2, 6)
        data = {"text": context, "num_samples": 5, "length": times}

    elif length == 'long':
        data = {"text": context, "num_samples": 5, "length": 20}

    count = 0
    while True:
        response = requests.post(url, data=data)

        if response.status_code == 200:
            res = response.json()
            print(type(res))
            for i in range(5):
                res[str(i)] = res[str(i)].strip()
            print(type(res))
            return res

        # 3초 초과 or 400 status 종료
        elif response.status_code not in [429, 200] or count == 15:
            return Response("fail", status=400)

        elif response.status_code == 429:
            count += 1
            time.sleep(0.2)

    return Response("fail", status=400)


@app.route("/")
def main():
    return render_template("index.html")


# Health Check
@app.route("/healthz", methods=["GET"])
def healthCheck():
    return "", 200


if __name__ == "__main__":
    from waitress import serve
    # app.debug = True
    serve(app, host='0.0.0.0', port=80)   
    # app.run(port=8080)
