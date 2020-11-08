from flask import Flask, request, Response, render_template, jsonify
import requests
import time
import random

# Server & Handling Setting
app = Flask(__name__)

models = {
    "gpt2-large": "http://main-gpt2-large-jeong-hyun-su.endpoint.ainize.ai/",
    "gpt2-cover-letter": "http://main-gpt2-cover-letter-jeong-hyun-su.endpoint.ainize.ai/",
    "gpt2-reddit": "http://master-gpt2-reddit-woomurf.endpoint.ainize.ai/",
    "gpt2-story": "http://main-gpt2-story-gmlee329.endpoint.ainize.ai/",
    "gpt2-ads": "http://main-gpt2-ads-psi1104.endpoint.ainize.ai/",
    "gpt2-business": "http://main-gpt2-business-leesangha.endpoint.ainize.ai/",
    "gpt2-film": "http://main-gpt2-film-gmlee329.endpoint.ainize.ai/",
    "gpt2-trump": "http://main-gpt2-trump-gmlee329.endpoint.ainize.ai/"
}


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
            for i in range(5):
                res[str(i)] = res[str(i)].strip()
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
