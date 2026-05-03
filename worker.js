
async function getSHA256(message) {
    let b = new TextEncoder().encode(message);  
    let hash = await crypto.subtle.digest('SHA-256', b);
    let hash_a  = Array.from(new Uint8Array(hash));
    let xhash = hash_a.map(b => b.toString(16).padStart(2, '0')).join('');
    return xhash;
}

async function minerar(data_input, previous_hash_value, assinatura) {
    var nonce = -1;
    var hash = "";

    do {
        nonce += 1
        hash = await getSHA256(nonce.toString()+data_input+previous_hash_value);
    } while (!hash.startsWith(assinatura))

    const answer = {
        hash: hash,
        nonce: nonce,
    }
    return answer;
}

self.onmessage = async (e) => {
    const { previous_hash_value, data_input, assinatura } = e.data;

    const result = await minerar(data_input, previous_hash_value, assinatura);

    self.postMessage(result);
}