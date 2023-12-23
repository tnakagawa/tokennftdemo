"use strict";

import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

const CHAIN_IDS = {
    "0x1": "Ethereum Mainnet",
    "0x5": "Goerli",
    "0xaa36a7": "Sepolia",
    "0x89": "Polygon Mainnet",
    "0x13881": "Mumbai",
};

let TOKEN_DEMO = null;

async function init() {
    let response = await fetch("./TokenDemo.json");
    TOKEN_DEMO = await response.json();
    // console.log(TOKEN_DEMO);
    console.log("init", ethers.version);
    Vue.createApp(MainApp).mount("#main");
}

function getContractAddress(account, chainId) {
    let key = account + "." + chainId + ".tokendemo.contractaddress";
    return localStorage.getItem(key);
}

function setContractAddress(account, chainId, address) {
    let key = account + "." + chainId + ".tokendemo.contractaddress";
    return localStorage.setItem(key, address);
}

const MainApp = {
    data() {
        return {
            loading: true,
            toast: {
                toast: null,
                message: "",
            },
            modal: {
                modal: null,
                title: "",
                message: "",
            },
            account: "",
            chainId: "",
            testnet: false,
            contractaddress: "",
            tokenname: "",
            tokensymbol: "",
            tokendecimals: 18,
            balanceOfAddress: "",
            balanceOfResult: "",
            mintaddress: "",
            mintvalue: "",
            eventNames: [],
            eventName: "",
            events: [],
        };
    },
    mounted() {
        this.init();
    },
    methods: {
        async init() {
            this.loading = false;
            this.modal.modal = new bootstrap.Modal('#modal', {});
            this.toast.toast = new bootstrap.Toast('#toast', { animation: true, autohide: true, delay: 3000 });
            for (let item of TOKEN_DEMO.abi) {
                if (item.type == "event") {
                    this.eventNames.push(item.name);
                    this.eventName = item.name;
                }
            }
            if (window.ethereum) {
                window.ethereum.on("accountsChanged", this.accountsChanged);
                window.ethereum.on("chainChanged", this.chainChanged);
                let provider = new ethers.BrowserProvider(window.ethereum);
                let accounts = await provider.listAccounts();
                if (accounts && accounts.length > 0) {
                    this.account = accounts[0].address;
                    let network = await provider.getNetwork();
                    this.chainId = "0x" + network.chainId.toString(16);
                    this.contractaddress = getContractAddress(this.account, this.chainId);
                    this.setNameAndSymbol();
                }
            }
            let tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
            let tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
            console.log(tooltipList);
        },
        showToast(message) {
            this.toast.message = message;
            this.toast.toast.show();
        },
        showModal(title, message) {
            this.modal.title = title;
            this.modal.message = message;
            this.modal.modal.show();
        },
        async clipboard(text) {
            await navigator.clipboard.writeText(text);
            this.showToast("Copied\n" + text);
        },
        async accountsChanged(accounts) {
            location.reload();
        },
        chainChanged(chainId) {
            this.chainId = chainId;
            location.reload();
        },
        shortAccount() {
            let addr = "";
            if (this.account && this.account.length > 0) {
                addr = this.account.substring(0, 6) + "..." + this.account.substring(36);
            }
            return addr;
        },
        chainIdName() {
            let name = "";
            if (this.chainId) {
                name = CHAIN_IDS[this.chainId];
                if (!name) {
                    name = "ChainId:" + this.chainId;
                }
            }
            return name;
        },
        async connect() {
            if (window.ethereum) {
                try {
                    await window.ethereum.request({ method: 'eth_requestAccounts' })
                    this.showToast("Connected to METAMASK.");
                } catch (err) {
                    if (err.code === 4001) {
                        console.log("Please connect to MetaMask.");
                    } else {
                        console.error(err);
                    }
                }
            } else {
                window.open("https://metamask.io/download/");
            }
        },
        async switchMumbai() {
            this.loading = true;
            try {
                await ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: "0x13881" }],
                });
            } catch (err) {
                console.log(err);
                if (err.code === 4902) {
                    try {
                        await ethereum.request({
                            method: "wallet_addEthereumChain",
                            params: [{
                                chainId: "0x13881",
                                chainName: "Mumbai",
                                nativeCurrency: {
                                    name: "MATIC",
                                    symbol: "MATIC",
                                    decimals: 18,
                                },
                                rpcUrls: ["https://rpc-mumbai.maticvigil.com"],
                                blockExplorerUrls: ["https://mumbai.polygonscan.com"],
                                iconUrls: [""],

                            }],
                        });
                    } catch (e) {
                        console.log(e);
                    }
                }
            }
            this.loading = false;
        },
        async deploy() {
            if (this.tokenname && this.tokensymbol) {
                if (this.contractaddress) {
                    if (!window.confirm("Already deployed.\nDo you want to override the deployment?")) {
                        return;
                    }
                }
                this.loading = true;
                try {
                    let provider = new ethers.BrowserProvider(window.ethereum);
                    let accounts = await provider.listAccounts();
                    if (accounts && accounts.length > 0) {
                        let signer = accounts[0];
                        let factory = new ethers.ContractFactory(TOKEN_DEMO.abi, TOKEN_DEMO.bytecode, signer);
                        let contract = await factory.deploy(this.tokenname, this.tokensymbol);
                        await contract.waitForDeployment();
                        this.contractaddress = contract.target;
                        setContractAddress(this.account, this.chainId, this.contractaddress);
                    }
                } catch (err) {
                    this.loading = false;
                    console.log(err);
                    if (err.code === 4001) {
                        this.showToast("Deploy canceled.");
                    } else {
                        this.showModal("Deploy Error", err.message);
                    }
                }
                this.loading = false;
            }
        },
        async setNameAndSymbol() {
            if (this.contractaddress) {
                try {
                    let provider = new ethers.BrowserProvider(window.ethereum);
                    let accounts = await provider.listAccounts();
                    if (accounts && accounts.length > 0) {
                        let signer = accounts[0];
                        let contract = new ethers.Contract(this.contractaddress, TOKEN_DEMO.abi, signer);
                        this.tokenname = await contract.name();
                        this.tokensymbol = await contract.symbol();
                        this.tokendecimals = await contract.decimals();
                    }
                } catch (err) {
                    this.showModal("Error setNameAndSymbol", err.message);
                }
            }
        },
        async mint() {
            if (this.contractaddress && this.mintaddress && this.mintvalue) {
                this.loading = true;
                try {
                    let provider = new ethers.BrowserProvider(window.ethereum);
                    let accounts = await provider.listAccounts();
                    if (accounts && accounts.length > 0) {
                        let signer = accounts[0];
                        let contract = new ethers.Contract(this.contractaddress, TOKEN_DEMO.abi, signer);
                        let value = ethers.parseUnits(this.mintvalue.toString(), this.tokendecimals);
                        let tx = await contract.mint(this.mintaddress, value);
                        await tx.wait();
                    }
                } catch (err) {
                    this.loading = false;
                    console.log(err);
                    if (err.code === 4001) {
                        this.showToast("Mint canceled.");
                    } else {
                        this.showModal("Mint Error", err.message);
                    }
                }
                this.loading = false;
            }
        },
        async balanceOf() {
            this.balanceOfResult = "";
            if (this.contractaddress && this.balanceOfAddress) {
                this.loading = true;
                try {
                    let provider = new ethers.BrowserProvider(window.ethereum);
                    let accounts = await provider.listAccounts();
                    if (accounts && accounts.length > 0) {
                        let signer = accounts[0];
                        let contract = new ethers.Contract(this.contractaddress, TOKEN_DEMO.abi, signer);
                        this.balanceOfResult = await contract.balanceOf(this.balanceOfAddress);
                        this.loading = false;
                        this.showToast("balanceOf\n" + this.balanceOfAddress + "\n"
                            + ethers.formatUnits(this.balanceOfResult, this.tokendecimals)
                            + " " + this.tokensymbol + " (" + this.balanceOfResult + ")");
                    }
                } catch (err) {
                    this.loading = false;
                    this.showModal("Error balanceOf", err.message);
                }
                this.loading = false;
            }
        },
        async totalSupply() {
            if (this.contractaddress) {
                this.loading = true;
                try {
                    let provider = new ethers.BrowserProvider(window.ethereum);
                    let accounts = await provider.listAccounts();
                    if (accounts && accounts.length > 0) {
                        let signer = accounts[0];
                        let contract = new ethers.Contract(this.contractaddress, TOKEN_DEMO.abi, signer);
                        let total = await contract.totalSupply();
                        this.loading = false;
                        this.showToast("totalSupply\n" + ethers.formatUnits(total, this.tokendecimals)
                            + " " + this.tokensymbol + " (" + total + ")");
                    }
                } catch (err) {
                    this.loading = false;
                    this.showModal("Error totalSupply", err.message);
                }
                this.loading = false;
            }
        },
        async getEvents() {
            if (window.ethereum && this.contractaddress) {
                this.loading = true;
                try {
                    let provider = new ethers.BrowserProvider(window.ethereum);
                    let accounts = await provider.listAccounts();
                    if (accounts && accounts.length > 0) {
                        let signer = accounts[0];
                        let contract = new ethers.Contract(this.contractaddress, TOKEN_DEMO.abi, signer);
                        let eventFilter = contract.filters[this.eventName]();
                        let blockNumber = await provider.getBlockNumber();
                        let events = await contract.queryFilter(eventFilter, blockNumber - 1000, blockNumber);
                        this.events.length = 0;
                        this.events = events;
                        this.showToast("getEvents\nfrom:" + (blockNumber - 1000) + "\nto  :" + blockNumber + "\nsize:" + events.length);
                    }
                } catch (err) {
                    console.log(err);
                    this.showModal("Error getEvents", err.message);
                }
                this.loading = false;
            }
        },
    }
}

window.addEventListener("load", init);