from flask import Flask, request, Response, render_template, jsonify
import requests
import time
import random
import json
import os
from transformers import PreTrainedTokenizerFast

eng_tokenizer = PreTrainedTokenizerFast.from_pretrained("gpt2-large")

# Server & Handling Setting
app = Flask(__name__, static_url_path='/static')

models = {
    "gpt2-large": "gpt2-large",
    "gpt2-cover-letter": "cover-letter-gpt2",
    "gpt2-story": "gpt2_story",
    "gpt2-reddit": "gpt2_reddit",
    "gpt2-trump": "gpt2_trump"
}

SERVER_URL = os.environ.get('GPT2_SERVER_URL')
AINIZE_STATUS_URL = os.environ.get('AINIZE_STATUS_URL')
API_DEV = os.environ.get('API_DEV')
API_STAGING = os.environ.get('API_STAGING')
API_PROD = os.environ.get('API_PROD')


@app.route("/status", methods=['GET'])
def ainize_status():
    try:
        branch_name = request.args.get('branchName')
        branch_name = branch_name.replace('/', '%2F')
        api = request.args.get('api')

        api_server = ''
        url = ''
        if api == "dev":
            api_server = API_DEV
        elif api == "staging":
            api_server = API_STAGING
        else:
            api_server = API_PROD
        url = api_server + '/v2/repos/teachable-ainize/gpt2-train/branches/' + branch_name
    except Exception:
        print("Empty Text")
        return Response("fail", status=400)
    response = requests.get(url, timeout=2)
    if response.status_code == 200:
        res = response.json()
        deployId = res["currentlyTryingDeployID"]
        url = api_server + '/v2/commits/ainize-status'
        headers = {'Content-Type': 'application/json; charset=utf-8'}
        data = {'deployId': deployId}
        result = requests.post(url, headers=headers, data=json.dumps(data))

        if result.status_code == 200:
            result = result.json()
        else:
            result = {'state': 'undefined'}
        return result

    else:
        return jsonify({'fail': 'error'}), response.status_code


@app.route("/url", methods=['POST'])
def gpt2_url():
    try:
        context = request.form['context']
        model_url = request.form['model']
        length_form = request.form['length']
    except Exception:
        print("Empty Text")
        return Response("fail", status=400)

    if length_form == 'short':
        times = random.randrange(2, 6)
        length = times
    elif length_form == 'long':
        length = 20

    headers = {'Content-Type': 'application/json; charset=utf-8'}
    is_kor = False
    if 'gpt-2-ko-small-finetune' in model_url:
        data = {"text": context, "num_samples": 5, "length": length}
        is_kor = True
    else:
        encoded_text = eng_tokenizer.encode(context)
        data = {"text": encoded_text, "num_samples": 5, "length": length}

    # print('model_url is', model_url)
    response = requests.post(model_url, headers=headers, data=json.dumps(data))
    if response.status_code == 200:
        result = dict()
        if is_kor:
            res = eval(response.text)
        else:
            res = response.json()

        for idx, sampleOutput in enumerate(res):
            if is_kor:
                result[idx] = sampleOutput
            else:
                result[idx] = eng_tokenizer.decode(
                    sampleOutput, skip_special_tokens=True)[len(context):]
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

    url = os.path.join(SERVER_URL, models[model])

    data = None
    headers = {'Content-Type': 'application/json'}

    if length == 'short':
        times = random.randrange(2, 6)
        data = {"text": context, "num_samples": 5, "length": times}
    elif length == 'long':
        data = {"text": context, "num_samples": 5, "length": 20}

    print('Context', context)
    print('Url', url)
    count = 0
    while True:
        response = requests.post(url, headers=headers, data=json.dumps(data))
        if response.status_code == 200:
            res = response.json()
            for key, val in res.items():
                res[key] = res[key][len(context):]
                print(res[key])
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
    app.run(debug=True, host='0.0.0.0', port=80, threaded=True)
