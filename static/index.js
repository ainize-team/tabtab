var idx = 0,       // 탭 번호
TAB_ON = false; // 탭 활성화

var editor = document.getElementsByClassName("editor")[0],
menu = document.getElementById("menu"),
items  = document.getElementsByClassName("item");

const KEY_CODE = {"TAB" : 9, "UP" : 38, "DOWN" : 40, "ENTER" : 13};

document.onkeydown = function(){
    const key = event.keyCode;

    // 탭을 누를 때, 5개의 추천 단어 활성화
    if(key == KEY_CODE.TAB){
        const select_model = document.getElementById("model");
        const model = select_model.options[select_model.selectedIndex].value;

        const select_length = document.getElementsByName("length");
        let length;

        if(select_length[0].checked == true) length = select_length[0].value;
        else if(select_length[1].checked == true) length = select_length[1].value;

        let formData = new FormData();

        formData.append("context", editor.innerText);
        formData.append("model", model);
        formData.append("length", length);

        fetch("/gpt2",
            {
                method: "POST",
                body: formData,
            }
        )
        .then(response => {
            if ( response.status == 200 ){
                return response;
            }
            else{
                throw Error("gpt2-word error");
            }
        })
        .then(response => response.json())
        .then(response => {
            menu = document.getElementById("menu");
            items = document.getElementsByClassName("item");

            // Response를 팝업 메뉴의 글씨로 설정
            for(let i=0; i<items.length; i++){
                items[i].innerHTML = response[i];
            }
            
            if(typeof window.getSelection != "undefined"){
                (function PopupShow(){
                    // 커서의 위치 Get
                    const selection = window.getSelection().getRangeAt(0);

                    const clientRects = selection.getClientRects();
                    // 커서의 왼쪽, 위를 기준으로 메뉴 팝업 설정
                    const cur_left = String(clientRects[0].left) + "px";
                    const cur_top = String(clientRects[0].top + 23) + "px";

                    // Tab을 누를 경우, 팝업 메뉴가 뜸 ( 커서의 위치를 기준으로 )
                    menu.style.left = cur_left;
                    menu.style.top = cur_top;
                    menu.style.display = "block";
                })();

                TAB_ON = true;
                idx = 0;

                document.getElementsByClassName("wrap-item")[idx].focus();
            }
        })
        .catch(e =>{
        });

        // 주소창 focus를 막기
        event.preventDefault();
    }

    // TAB 활성화 && ENTER 혹은 (UP, DOWN을 제외한 나머지 키들)
    else if(TAB_ON == true && (key == KEY_CODE.ENTER || (key != KEY_CODE.UP && key != KEY_CODE.DOWN))){
        // ENTER 누를 때, 에디터에 해당 글자 대입
        if(key == KEY_CODE.ENTER){
            wrap_items = document.getElementsByClassName("wrap-item");

            editor.innerText += wrap_items[idx].innerText;
        }
        // 커서 이동 마지막 문자로,
        setCurrentCursorPosition(editor.innerText.length);

        // 커서 이동 후, 다음 줄 넘어가는 것을 방지
        event.preventDefault();

        // 탭 비활성화
        menu.style.display = "none";
        idx = 0;
        TAB_ON = false;
    }
    // TAB 활성화 && UP 혹은 DOWN
    else if(TAB_ON == true && (key == KEY_CODE.UP || key == KEY_CODE.DOWN)){
        event.preventDefault();

        // 해당 아이템 포커싱
        wrap_items = document.getElementsByClassName("wrap-item");

        if(key == KEY_CODE.UP && idx > 0) idx--;
        else if(key == KEY_CODE.DOWN && idx < 4) idx++;

        wrap_items[idx].focus();
    }
};

function createRange(node, chars, range) {
    if (!range) {
        range = document.createRange()
        range.selectNode(node);
        range.setStart(node, 0);
    }

    if (chars.count === 0) {
        range.setEnd(node, chars.count);
    }
    else if (node && chars.count > 0) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent.length >= chars.count) {
                range.setEnd(node, chars.count);
                chars.count = 0;
            }
        }
        else {
            for (var lp = 0; lp < node.childNodes.length; lp++) {
                range = createRange(node.childNodes[lp], chars, range);

                if (chars.count === 0) {
                    break;
                }
            }
        }
    }

    return range;
};

function setCurrentCursorPosition(chars) {
    if (chars >= 0) {
        var selection = window.getSelection();

        range = createRange(editor.parentNode, {
            count: chars
        });

        if (range) {
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
};

function showDescription(e){
    const description = document.getElementById("description");

    switch (e.value){
        case "gpt2-large":
            description.innerHTML = "This is the basic model in GPT-2." + "<br><br>" +
                "Today, scientists confirmed the worst possible outcome: the massive asteroid will collide with Earth" + "<u style='background-color: blue'>.</u>" + "<br>" +
                "<u style='background-color: blue'>" + "They have called this asteroid one of the most likely near-planet collisions in history." + "</u>" + "<br>";
            break;

        case "gpt2-cover-letter":
            description.innerText = "cover letter is good!";
            break;

        case "gpt2-reddit":
            description.innerText = "GPT2-reddit is trained by reddit data and generate words and sentences like community posts.";
            break;

        case "gpt2-story":
            description.innerText = "This GPT2-story model generates genre story text. When you enter text at the beginning of the story, the model gives you the rest of the story as long as you want.";
            break;

        case "gpt2-ads":
            description.innerText = "ads is good!";
            break;

        case "gpt2-film":
            description.innerText = "This GPT2-film model generates film script text. When you enter text for the beginning of the film script, the model gives you the rest of the film script as long as you want."
            break;

        case "gpt2-business":
            description.innerText = "business style GPT2 model";
            break;

        case "gpt2-trump":
            description.innerText = "This GPT2-trump model generates Donald trump’s tweets style text. When you enter text for the beginning of the tweets, the model gives you the rest of the tweets as long as you want."
            break;
    }

}