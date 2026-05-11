const bloco_template = document.getElementById("bloco-template");
const minerar_btn = document.querySelectorAll(".minerar-btn");
const novo_bloco_btn = document.getElementById("novo-bloco-btn");

const auto_sync = document.getElementById("globalsync");


const assinatura = "0000";


const worker = new Worker('../worker.js', { type: 'module' });
worker.onerror = e => console.error(e.message);


function change_background_color(e, hash){
    let ass_length = assinatura.length;
    let color = hash.substring(ass_length, ass_length+6);

    e.style.backgroundColor = `#${color}`
    e.style.color = "#ffffff"
}


function check_chain(node_letter){
    let last_block = parseInt(document.querySelector(`#novo-bloco-btn[data-row="${node_letter}"]`).dataset.col);
    let curr_block = 0;
    
    while (++curr_block < last_block){
        let hash_atual = document.querySelector(`.hash-output#${node_letter}${curr_block}`).value;
        let hash_previa  = document.querySelector(`.previous-hash-output#${node_letter}${curr_block+1}`).value;

        if (hash_atual != hash_previa || hash_previa == "") {
            return [1, curr_block];
        }
    }
    return [0, curr_block];
}


function copy_chain(node_from, node_to, blocks){

    for (let i = 1; i <= blocks; i++){
        document.querySelector(`.nonce-output#${node_to}${i}`).value = document.querySelector(`.nonce-output#${node_from}${i}`).value;
        document.querySelector(`.data-input#${node_to}${i}`).value = document.querySelector(`.data-input#${node_from}${i}`).value;
        document.querySelector(`.previous-hash-output#${node_to}${i}`).value = document.querySelector(`.previous-hash-output#${node_from}${i}`).value;
        document.querySelector(`.hash-output#${node_to}${i}`).value = document.querySelector(`.hash-output#${node_from}${i}`).value;

        change_background_color(document.querySelector(`.previous-hash-output#${node_to}${i}`), document.querySelector(`.previous-hash-output#${node_to}${i}`).value);
        change_background_color(document.querySelector(`.hash-output#${node_to}${i}`), document.querySelector(`.hash-output#${node_to}${i}`).value);
    }

    document.getElementById(`${node_to}node`).dataset.fullblocks = blocks;

    //console.log(`${node_from} ${node_to} ${blocks}`);
}


var current_block;
var current_node;
function minerar(e){
    document.querySelectorAll('button').forEach(b => {
        b.disabled = true;
    });

    current_node  = e.currentTarget.id[0];
    current_block = parseInt(e.currentTarget.id.slice(1));


    let any_previous_hash = document.querySelector(`#${current_node}${current_block-1} .hash-output`);
    if (any_previous_hash != null){
        document.querySelector(`#${current_node}${current_block} .previous-hash-output`).value = any_previous_hash.value;
        change_background_color(document.querySelector(`#${current_node}${current_block} .previous-hash-output`), any_previous_hash.value);
    }


    const dados = {
        previous_hash_value: document.querySelector(`#${current_node}${current_block} .previous-hash-output`).value,
        data_input: document.querySelector(`#${current_node}${current_block} .data-input`).value,
        assinatura: assinatura,
    }
    worker.postMessage(dados);
}

worker.onmessage = e => {
    const {hash, nonce} = e.data;

    document.querySelector(`#${current_node}${current_block} .hash-output`).value = hash;
    change_background_color(document.querySelector(`#${current_node}${current_block} .hash-output`), hash);
    document.querySelector(`#${current_node}${current_block} .nonce-output`).value = nonce.toString();

    document.querySelectorAll('button').forEach(b => {
        b.disabled = false;
    });

    let result = check_chain(current_node);
    document.getElementById(`${current_node}node`).dataset.broken = result[0];
    document.getElementById(`${current_node}node`).dataset.fullblocks = result[1];


    if (auto_sync.checked && result[0] == 0){
        for (const node of "abc") {
            if (node != current_node) update_chain(node);
        }
    }
};


function new_block(block_ltr, block_num){
    const previous_bloco_id = `${block_ltr}${block_num}`;
    const block_id = `${block_ltr}${block_num+1}`;

    const f = document.createDocumentFragment();
    const node = bloco_template.content.cloneNode(true);

    node.querySelector(".title").id = block_id;
    node.querySelector(".bloco").id = block_id;
    node.querySelector(".nonce-output").id = block_id;
    node.querySelector(".data-input").id = block_id;
    node.querySelector(".hash-output").id = block_id;
    node.querySelector(".previous-hash-output").id = block_id;
    node.querySelector(".minerar-btn").id = block_id;

    node.querySelector(".title").value = `Bloco #${block_id}` ;

    previous_hash = document.querySelector(`#${CSS.escape(previous_bloco_id)} .hash-output`).value;
    node.querySelector(".previous-hash-output").value = previous_hash;
    change_background_color(node.querySelector(".previous-hash-output"), previous_hash)

    node.querySelector(".minerar-btn").addEventListener('click', minerar);

    f.appendChild(node);

    return f;
}


function update_chain(node_letter){
    console.log(node_letter);

    const maior = Array.from( document.querySelectorAll("[data-fullblocks]") ).reduce((p, c) => {
        return (parseInt(c.dataset.fullblocks) > parseInt(p.dataset.fullblocks) ? c : p);
    });
    
    if (maior.id[0] != node_letter){
        let qtd_maior = parseInt(maior.dataset.fullblocks);
        let qtd_poss_menor = parseInt(document.getElementById(`${node_letter}node`).dataset.blocks);
        let diff = qtd_maior-qtd_poss_menor
        
        let b = document.querySelector(`#novo-bloco-btn[data-row="${node_letter}"]`);
        let block_num = parseInt(b.dataset.col);
        for (let i = 0; i < diff; i++){

            b.setAttribute('data-col', block_num+1);
            b.before(new_block(node_letter, block_num++));
            document.getElementById(`${node_letter}node`).dataset.blocks = parseInt(document.getElementById(`${node_letter}node`).dataset.blocks)+1;
        }

        copy_chain(maior.id[0], node_letter, qtd_maior);
    }
}

document.querySelectorAll("#novo-bloco-btn").forEach(b => {
    b.addEventListener('click', (e) => {
        const block_ltr = e.target.dataset.row;
        let block_num = parseInt(e.target.dataset.col);

        if (!document.getElementById(`${block_ltr}sync`).checked){
            e.target.setAttribute('data-col', block_num+1);
            b.before(new_block(block_ltr, block_num));

            document.getElementById(`${block_ltr}node`).dataset.blocks = parseInt(document.getElementById(`${block_ltr}node`).dataset.blocks)+1;
            return;
        }

        const maior = Array.from( document.querySelectorAll("[data-fullblocks]") ).reduce((p, c) => {
            return (parseInt(c.dataset.fullblocks) > parseInt(p.dataset.fullblocks) ? c : p);
        });

        if (maior.id[0] != block_ltr){
            let qtd_maior = parseInt(maior.dataset.fullblocks);
            let qtd_poss_menor = parseInt(document.getElementById(`${block_ltr}node`).dataset.blocks);
            let diff = qtd_maior-qtd_poss_menor

            for (let i = 0; i < diff; i++){
                e.target.setAttribute('data-col', block_num+1);
                b.before(new_block(block_ltr, block_num++));
                document.getElementById(`${block_ltr}node`).dataset.blocks = parseInt(document.getElementById(`${block_ltr}node`).dataset.blocks)+1;
            }

            copy_chain(maior.id[0], block_ltr, qtd_maior);
        }


        e.target.setAttribute('data-col', block_num+1);
        b.before(new_block(block_ltr, block_num));
        document.getElementById(`${block_ltr}node`).dataset.blocks = parseInt(document.getElementById(`${block_ltr}node`).dataset.blocks)+1;
    });
})



minerar_btn.forEach( b => {
    b.addEventListener('click', minerar);
});


document.getElementById("check").addEventListener('click', e => {
     console.log("CHECk>:")
    console.log(document.getElementById("anode").dataset.blocks)
    console.log(document.getElementById("anode").dataset.fullblocks)
    console.log(" ")
    console.log(document.getElementById("bnode").dataset.blocks)
    console.log(document.getElementById("bnode").dataset.fullblocks)
    console.log(" ")
    console.log(document.getElementById("cnode").dataset.blocks)
    console.log(document.getElementById("cnode").dataset.fullblocks)

});