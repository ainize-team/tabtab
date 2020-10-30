from transformers import AutoModelWithLMHead, AutoTokenizer, top_k_top_p_filtering
import torch
from flask import Flask, request, Response, render_template
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
    "gpt2-word" : "http://main-gpt2-word-jeong-hyun-su.endpoint.ainize.ai/gpt2-word",
    "gpt2-generation" : "http://main-gpt2-large-gmlee329.endpoint.ainize.ai/gpt2-generation",
    "gpt2-letter-word" : "",
}

# Queue 핸들링
def handle_requests_by_batch():
    while True:
        requests_batch = []
        while not (len(requests_batch) >= BATCH_SIZE):
            try:
                requests_batch.append(requests_queue.get(timeout=CHECK_INTERVAL))
            except Empty:
                continue

            for requests in requests_batch:
                requests['output'] = run(requests['input'][0], requests['input'][1], requests['input'][2])


# 쓰레드
threading.Thread(target=handle_requests_by_batch).start()


# Running GPT-2
def run(context, model, length):
    # API calling
    url = models[model]

    if 'word' in model:
        data = {"text": context, "num_samples": 5}
    else:
        data = {"text": context, "num_samples": 5, "length": length}

    response = requests.post(url, data=data)

    print(response.json())
    return response.json()


@app.route("/gpt2", methods=['POST'])
def gpt2():
    # 큐에 쌓여있을 경우,
    if requests_queue.qsize() > BATCH_SIZE:
        return jsonify({'error': 'TooManyReqeusts'}), 429

    # 웹페이지로부터 이미지와 스타일 정보를 얻어옴.
    try:
        context = request.form['context']
        model = request.form['model']
        length = request.form['length']

    except Exception:
        print("Empty Text")
        return Response("fail", status=400)

    # Queue - put data
    req = {
        'input': [context, model, length]
    }
    requests_queue.put(req)

    # Queue - wait & check
    while 'output' not in req:
        time.sleep(CHECK_INTERVAL)

    return req['output']


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
