import Gmail from "./index";

var G = new Gmail();

G.SingleDelivery({
    from :"thatazimjaved@gmail.com",
    to: "thatazimjaved@gmail.com",
    subject :"Lols",
    body:"Haha lols funny"
}).then(()=>{
    console.log("Haha lmao");
})