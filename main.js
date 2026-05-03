const bloco_template = document.getElementById("bloco-template");
const minerar_btn = document.querySelectorAll(".minerar-btn");
const assinatura_input = document.getElementById("assinatura-input");
const novo_bloco_btn = document.getElementById("novo-bloco-btn");

const worker = new Worker('./worker.js', { type: 'module' });
worker.onerror = e => console.error(e.message);

var current_block_id = 1;

function change_background_color(e, hash){
    ass_length = assinatura_input.value.length;
    color = hash.substring(ass_length, ass_length+6);

    e.style.backgroundColor = `#${color}`
    e.style.color = "#ffffff"
}


function minerar(e){
    document.querySelectorAll('button').forEach(b => {
        b.disabled = true;
    });

    current_block =  e.currentTarget.id;
    any_previous_hash = document.querySelector(`#${CSS.escape(parseInt(current_block, 10)-1)} .hash-output`);
    if (any_previous_hash != null){
        document.querySelector(`#${CSS.escape(current_block)} .previous-hash-output`).value = any_previous_hash.value;
        change_background_color(document.querySelector(`#${CSS.escape(current_block)} .previous-hash-output`), any_previous_hash.value);
    }
    const previous_hash_value = document.querySelector(`#${CSS.escape(current_block)} .previous-hash-output`).value;
    const data_input = document.querySelector(`#${CSS.escape(current_block)} .data-input`).value;


    const dados = {
        previous_hash_value: document.querySelector(`#${CSS.escape(current_block)} .previous-hash-output`).value,
        data_input: document.querySelector(`#${CSS.escape(current_block)} .data-input`).value,
        assinatura: assinatura_input.value,
    }
    worker.postMessage(dados);
}
worker.onmessage = e => {
    const {hash, nonce} = e.data;

    console.log("wow");

    document.querySelector(`#${CSS.escape(current_block)} .hash-output`).value = hash;
    change_background_color(document.querySelector(`#${CSS.escape(current_block)} .hash-output`), hash);
    document.querySelector(`#${CSS.escape(current_block)} .nonce-output`).value = nonce.toString();

    document.querySelectorAll('button').forEach(b => {
        b.disabled = false;
    });
};



novo_bloco_btn.addEventListener('click', (e) => {
    const previous_bloco_id = `${current_block_id++}`;
    const block_id = `${current_block_id}`;

    const f = document.createDocumentFragment();
    const node = bloco_template.content.cloneNode(true);

    node.querySelector(".bloco").id = block_id;
    node.querySelector(".nonce-output").id = block_id;
    node.querySelector(".data-input").id = block_id;
    node.querySelector(".hash-output").id = block_id;
    node.querySelector(".previous-hash-output").id = block_id;
    node.querySelector(".minerar-btn").id = block_id;

    previous_hash = document.querySelector(`#${CSS.escape(previous_bloco_id)} .hash-output`).value;
    node.querySelector(".previous-hash-output").value = previous_hash;
    change_background_color(node.querySelector(".previous-hash-output"), previous_hash)

    node.querySelector(".minerar-btn").addEventListener('click', minerar);

    f.appendChild(node);
    f.append(document.createElement('br'), document.createElement('br'));
    novo_bloco_btn.before(f);
});

minerar_btn.forEach( b => {
    b.addEventListener('click', minerar);
});