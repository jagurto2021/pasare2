import KEYS from "../assets/Keys.js"

const $d = document;
const $paquetes = $d.getElementById("paquetes");
const $template = $d.getElementById("paquete-template").content;
const $fragment = $d.createDocumentFragment();
//headers a pasar a nuestra peticion
//pasaremos nuestra KEY.secret, importando clave secreta en options
const options = { headers: {Authorization: `Bearer ${KEYS.secret}`}}

//formato a moneda con decimales en nuevos soles
const FormatoDeMoneda = num => `S/.${num.slice(0, -2)}.${num.slice(-2)}`;

//
let products, prices;

//promesas, peticiones a una API. objeto promise
//fetch, se pasa products y prices de stripe(documentacion)
//si no se pone la respuesta, saldra error 401(sin autorizacion)
// se pone como respuesta la const options, contiene la keys secret
Promise.all([
    fetch("https://api.stripe.com/v1/products", options),
    fetch("https://api.stripe.com/v1/prices", options)
])
.then(responses => Promise.all(responses.map(res => res.json())))
.then(json => {
    products = json[0].data;
    prices = json[1].data;

    prices.forEach(el => {
        let productData = products.filter(product => product.id === el.product);
        
        $template.querySelector(".paquete").setAttribute("data-price", el.id);
        $template.querySelector("img").src = productData[0].images[0];
        $template.querySelector("img").alt = productData[0].name;
        //arma precio, muestra
        $template.querySelector("figcaption").innerHTML = `${productData[0].name} ${FormatoDeMoneda(el.unit_amount_decimal)} ${(el.currency).toUpperCase()}`;

        let $clone = $d.importNode($template, true);

        $fragment.appendChild($clone);
    });
//
    $paquetes.appendChild($fragment);
}) 
//en caso de error, metemos un catch
.catch(error => {
    let message = error.statuText || "Ocurrió un error en la petición";
    //para que nos traiga el codigo del erro con el mensaje
    $paquetes.innerHTML = `Error: ${error.status}: ${message}`;
})


$d.addEventListener("click", e => {
    //viene de section
    if (e.target.matches(".paquetes *")) {
        //alert("sss")
        let priceId = e.target.parentElement.getAttribute("data-price");

        Stripe(KEYS.public).redirectToCheckout({
            lineItems: [{
                price: priceId,
                quantity: 1
            }],
            mode: "payment",
            successUrl:"http://127.0.01:5500/assets/success.html",
            cancelUrl:"http://127.0.01:5500/assets/success.html"
        })
        .then(res => {
            if (res.error){
                $paquetes.insertAdjacentElement("afterend", res.error.message)
            }
        })
    }
})