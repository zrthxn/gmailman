"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("./index"));
var G = new index_1.default();
G.SingleDelivery({
    from: "thatazimjaved@gmail.com",
    to: "thatazimjaved@gmail.com",
    subject: "Lols",
    body: "Haha lols funny"
}).then(() => {
    console.log("Haha lmao");
});
