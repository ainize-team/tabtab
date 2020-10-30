from transformers import AutoModelWithLMHead, AutoTokenizer, top_k_top_p_filtering
import torch
from flask import Flask, request, Response, render_template, jsonify
import requests
from torch.nn import functional as F
from queue import Queue, Empty
import time
import threading

# Server & Handling Setting
app = Flask(__name__)

requests_queue = Queue()
BATCH_SIZE = 1
CHECK_INTERVAL = 0.1

models = {
    "gpt2-large" : "http://main-gpt2-large-jeong-hyun-su.endpoint.ainize.ai/",
    "gpt2-cover-letter" : "http://main-gpt2-cover-letter-jeong-hyun-su.endpoint.ainize.ai/",
}


@app.route("/gpt2", methods=['POST'])
def gpt2():
    # 큐에 쌓여있을 경우,
    if requests_queue.qsize() > BATCH_SIZE:
        return jsonify({'error': 'Too Many Requests'}), 429

    # 웹페이지로부터 이미지와 스타일 정보를 얻어옴.
    try:
        context = request.form['context']
        model = request.form['model']
        length = request.form['length']

    except Exception:
        print("Empty Text")
        return Response("fail", status=400)


    url = models[model] + model + "/" + length

    if length == 'short':
        data = {"text": context, "num_samples": 5}
    elif length == 'long':
        data = {"text": context, "num_samples": 5, "length": 20}

    count = 0
    while True:
        response = requests.post(url, data=data)

        if response.status_code == 200:
            return response.json()

        # 3초 초과 or 400 status 종료
        elif response.status_code == 400 or count == 15:
            return Response("fail", status=400)

        elif response.status_code == 429:
            count += 1
            time.sleep(0.2)



@app.route("/")
def main():
    return render_template("index.html")


# Health Check
@app.route("/healthz", methods=["GET"])
def healthCheck():
    return "", 200


if __name__ == "__main__":
    from waitress import serve
    serve(app, host='0.0.0.0', port=80)
