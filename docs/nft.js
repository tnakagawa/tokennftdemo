"use strict";

import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

const NO_IMAGE = "./no_image.jpg";

const API_KEY_KEY = "nft.storage.apikey";

const CHAIN_IDS = {
    "0x1": "Ethereum Mainnet",
    "0x5": "Goerli",
    "0xaa36a7": "Sepolia",
    "0x89": "Polygon Mainnet",
    "0x13881": "Mumbai",
};

let NFT_DEMO = null;

async function init() {
    let response = await fetch("./NftDemo.json");
    NFT_DEMO = await response.json();
    // console.log(NFT_DEMO);
    console.log("init", ethers.version);
    Vue.createApp(MainApp).mount("#main");
}

function getContractAddress(account, chainId) {
    let key = account + "." + chainId + ".nftdemo.contractaddress";
    return localStorage.getItem(key);
}

function setContractAddress(account, chainId, address) {
    let key = account + "." + chainId + ".nftdemo.contractaddress";
    return localStorage.setItem(key, address);
}

function saveCameraId(id) {
    localStorage.setItem('cameraId', id);
}

function loadCameraId() {
    return localStorage.getItem('cameraId') || '';
}

const MainApp = {
    data() {
        return {
            loading: true,
            loadingmessage: "",
            toast: {
                toast: null,
                message: "",
            },
            modal: {
                modal: null,
                title: "",
                message: "",
            },
            qrmodal: {
                modal: null,
                message: "",
            },
            readermodal: {
                modal: null,
                message: "",
            },
            scanner: null,
            cameraid: "",
            cameralabel: "",
            scanname: "",
            qrcode: null,
            account: "",
            chainId: "",
            testnet: false,
            contractaddress: "",
            tokenname: "",
            tokensymbol: "",
            balanceOfAddress: "",
            balanceOfResult: "",
            ownerOfTokenId: "",
            ownerOfResult: "",
            tokenURITokenId: "",
            tokenURIResult: "",
            mintaccount: "",
            minturi: "",
            apikey: "",
            apiKeyCheck: false,
            imgfile: null,
            imgurl: NO_IMAGE,
            metaname: "",
            metadescription: "",
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
            this.qrmodal.modal = new bootstrap.Modal('#qrmodal', {});
            this.cameraid = loadCameraId();
            this.readermodal.modal = new bootstrap.Modal('#readermodal', {});
            let element = document.getElementById('readermodal');
            element.addEventListener('hidden.bs.modal', this.hideReader);
            this.scanner = new Html5Qrcode("reader");
            console.log(this.scanner);
            this.toast.toast = new bootstrap.Toast('#toast', { animation: true, autohide: true, delay: 3000 });
            for (let item of NFT_DEMO.abi) {
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
                    this.apikey = localStorage.getItem(API_KEY_KEY);
                    if (this.apikey) {
                        this.apiKeyCheck = true;
                    }
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
        async showQr(text) {
            this.qrmodal.message = "";
            if (this.qrcode) {
                this.qrcode.clear();
                this.qrcode.makeCode(text);
            } else {
                this.qrcode = new QRCode("qrcode", {
                    text: text,
                    width: 256,
                    height: 256,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.M
                });

            }
            this.qrmodal.message = text;
            this.qrmodal.modal.show();
        },
        async showReader(name) {
            this.scanname = name;
            try {
                this.loading = true;
                await this.readermodal.modal.show();
                await this.startScanner(this.cameraid);
                this.loading = false;
            } catch (e) {
                setTimeout(async () => {
                    await this.readermodal.modal.hide();
                    this.showModal("Error QR Scanner", e.message);
                    console.log(e);
                    this.loading = false;
                }, 500);
            }
        },
        async hideReader(event) {
            console.log(event);
            if (this.scanner.getState() == 2) {
                await this.scanner.stop();
            }
        },
        async startScanner(id) {
            let cameras = await Html5Qrcode.getCameras();
            console.log(cameras);
            if (cameras.length > 0) {
                let cameraId = cameras[0].id;
                this.cameralabel = cameras[0].label;
                if (id) {
                    for (let camera of cameras) {
                        if (camera.id == id) {
                            cameraId = camera.id;
                            this.cameralabel = camera.label;
                            break;
                        }
                    }
                }
                if (this.scanner.getState() == 2) {
                    await this.scanner.stop();
                }
                this.cameraid = cameraId;
                saveCameraId(cameraId);
                await this.scanner.start(
                    cameraId,
                    {
                        fps: 20,
                        qrbox: 200,
                    },
                    this.onScanSuccess,
                );
            }
        },
        async changeCamera() {
            this.cameralabel = "";
            if (this.scanner.getState() == 2) {
                this.loading = true;
                let settings = this.scanner.getRunningTrackSettings();
                let id = settings.deviceId;
                let cameras = await Html5Qrcode.getCameras();
                for (let i = 0; i < cameras.length; i++) {
                    if (cameras[i].id == id) {
                        id = cameras[(i + 1) % cameras.length].id;
                        break;
                    }
                }
                await this.startScanner(id);
                this.loading = false;
            }
        },
        async onScanSuccess(decodedText, decodedResult) {
            console.log(decodedText, decodedResult);
            if (decodedText) {
                let find = decodedText.match(/[0-9a-fA-F]{40}/);
                if (find) {
                    let addr = find[0];
                    if (ethers.isAddress(addr)) {
                        this[this.scanname] = "0x" + addr;
                        await this.readermodal.modal.hide();
                    }
                }
            }
        },
        startLoading() {
            this.loading = true;
            this.loadingmessage = "";
        },
        stopLoading() {
            this.loading = false;
            this.loadingmessage = "";
        },
        async accountsChanged(accounts) {
            location.reload();
        },
        chainChanged(chainId) {
            this.chainId = chainId;
            location.reload();
        },
        shortAccount(account) {
            let addr = "";
            if (account && account.length > 0) {
                addr = account.substring(0, 6) + "…" + account.substring(36);
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
        onImage(e) {
            this.imgfile = e.target.files[0];
            this.imgurl = URL.createObjectURL(this.imgfile);
        },
        changeApiKey() {
            this.apiKeyCheck = false;
        },
        async checkApiKey() {
            this.loading = true;
            this.apiKeyCheck = false;
            try {
                const options = {
                    method: "GET",
                    headers: {
                        "Authorization": "Bearer " + this.apikey,
                    }
                };
                let response = await fetch('https://api.nft.storage/', options);
                let json = await response.json();
                if (json.ok) {
                    this.apiKeyCheck = true;
                    this.showToast("OK checkApiKey");
                    localStorage.setItem(API_KEY_KEY, this.apikey);
                } else {
                    this.showModal("NG checkApiKey", JSON.stringify(json, null, 2));
                }
            } catch (err) {
                this.showModal("Error checkApiKey", err.message);
            }
            this.loading = false;
        },
        async deploy() {
            if (this.tokenname && this.tokensymbol) {
                if (this.contractaddress) {
                    if (!window.confirm("Already deployed.\nDo you want to override the deployment?")) {
                        this.loading = false;
                        return;
                    }
                }
                this.loading = true;
                try {
                    let provider = new ethers.BrowserProvider(window.ethereum);
                    let accounts = await provider.listAccounts();
                    if (accounts && accounts.length > 0) {
                        let signer = accounts[0];
                        let factory = new ethers.ContractFactory(NFT_DEMO.abi, NFT_DEMO.bytecode, signer);
                        let contract = await factory.deploy(this.tokenname, this.tokensymbol);
                        await contract.waitForDeployment();
                        this.contractaddress = contract.target;
                        setContractAddress(this.account, this.chainId, this.contractaddress);
                    }
                } catch (err) {
                    console.log(err);
                    this.loading = false;
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
                        let contract = new ethers.Contract(this.contractaddress, NFT_DEMO.abi, signer);
                        this.tokenname = await contract.name();
                        this.tokensymbol = await contract.symbol();
                    }
                } catch (err) {
                    this.showModal("Error setNameAndSymbol", err.message);
                }
            }
        },
        async balanceOf() {
            this.balanceOfResult = "";
            if (this.contractaddress && this.balanceOfAddress) {
                try {
                    let provider = new ethers.BrowserProvider(window.ethereum);
                    let accounts = await provider.listAccounts();
                    if (accounts && accounts.length > 0) {
                        let signer = accounts[0];
                        let contract = new ethers.Contract(this.contractaddress, NFT_DEMO.abi, signer);
                        this.balanceOfResult = await contract.balanceOf(this.balanceOfAddress);
                        this.showToast("balanceOf\n" + this.balanceOfAddress + "\n" + this.balanceOfResult);
                    }
                } catch (err) {
                    this.showModal("Error balanceOf", err.message);
                }
            }
        },
        async ownerOf() {
            this.ownerOfResult = "";
            if (this.contractaddress && this.ownerOfTokenId) {
                try {
                    let provider = new ethers.BrowserProvider(window.ethereum);
                    let accounts = await provider.listAccounts();
                    if (accounts && accounts.length > 0) {
                        let signer = accounts[0];
                        let contract = new ethers.Contract(this.contractaddress, NFT_DEMO.abi, signer);
                        this.ownerOfResult = await contract.ownerOf(this.ownerOfTokenId);
                        this.showToast("ownerOf\n_tokenId: " + this.ownerOfTokenId + "\n" + this.ownerOfResult);
                    }
                } catch (err) {
                    this.showModal("Error ownerOf", err.message);
                }
            }
        },
        async tokenURI() {
            this.tokenURIResult = "";
            if (this.contractaddress && this.tokenURITokenId) {
                try {
                    let provider = new ethers.BrowserProvider(window.ethereum);
                    let accounts = await provider.listAccounts();
                    if (accounts && accounts.length > 0) {
                        let signer = accounts[0];
                        let contract = new ethers.Contract(this.contractaddress, NFT_DEMO.abi, signer);
                        this.tokenURIResult = await contract.tokenURI(this.tokenURITokenId);
                        this.showToast("tokenURI\n_tokenId: " + this.tokenURITokenId + "\n" + this.tokenURIResult);
                    }
                } catch (err) {
                    this.showModal("Error tokenURI", err.message);
                }
            }
        },
        isMint() {
            let result = false;
            if (this.apiKeyCheck && this.imgfile != null && this.metaname && this.metadescription && this.account) {
                result = true;
            }
            return result;
        },
        async mint() {
            if (this.isMint()) {
                this.startLoading();
                try {
                    this.loadingmessage = "Uploading images...";
                    let data = await this.uploadImage();
                    this.loadingmessage = "Uploading metadata...";
                    let url = await this.uploadMeta(data);
                    let provider = new ethers.BrowserProvider(window.ethereum);
                    let accounts = await provider.listAccounts();
                    if (accounts && accounts.length > 0) {
                        let signer = accounts[0];
                        let contract = new ethers.Contract(this.contractaddress, NFT_DEMO.abi, signer);
                        console.log(">>> mint");
                        this.loadingmessage = "Waiting for mint...";
                        let tx = await contract.mint(this.mintaccount, url);
                        console.log("<<< mint");
                        console.log(">>> wait");
                        this.loadingmessage = "Waiting for transaction...";
                        let receipt = await tx.wait();
                        console.log("<<< wait");
                        console.log(receipt);
                        this.$refs.file.value = null;
                        this.imgurl = NO_IMAGE;
                        this.metaname = "";
                        this.metadescription = "";
                        this.mintaccount = "";
                        let message = "";
                        for (let log of receipt.logs) {
                            if (log.address == this.contractaddress) {
                                if (log.topics[0] == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
                                    message = "from    : 0x" + log.topics[1].substring(26)
                                        + "\nto      : 0x" + log.topics[2].substring(26)
                                        + "\ntokenId : " + BigInt(log.topics[3]).toString(10);
                                    break;
                                }
                            }
                            if (message) {
                                break;
                            }
                        }
                        this.showToast("Success Mint\n" + message);
                    }
                } catch (err) {
                    console.log(err);
                    if (err.code != 4001) {
                        this.showModal("Error mint", err.message);
                    }
                }
                this.stopLoading();
            }
        },
        async uploadImage() {
            console.log(">>> uploadImage");
            let name = this.imgfile.name;
            let ext = name.split('.').pop();
            let formData = new FormData();
            formData.append("file", this.imgfile, "image." + ext.toLowerCase());
            let options = {
                method: "POST",
                body: formData,
                headers: {
                    "Authorization": "Bearer " + this.apikey,
                }
            };
            let response = await fetch('https://api.nft.storage/upload', options);
            let json = await response.json();
            if (!json.ok) {
                throw new Error(JSON.stringify(json, null, 2));
            }
            console.log("<<< uploadImage");
            return json;
        },
        async uploadMeta(data) {
            console.log(">>> uploadMeta");
            let imageUrl = "ipfs://ipfs/" + data.value.cid + "/" + data.value.files[0].name;
            let meta = {
                name: this.metaname,
                description: this.metadescription,
                image: imageUrl,
            };
            let formData = new FormData();
            formData.append("file", new Blob([JSON.stringify(meta, null, 2)], { type: "application/json", }), "meta.json");
            let options = {
                method: "POST",
                body: formData,
                headers: {
                    "Authorization": "Bearer " + this.apikey,
                }
            };
            let response = await fetch('https://api.nft.storage/upload', options);
            let json = await response.json();
            if (!json.ok) {
                throw new Error(JSON.stringify(json, null, 2));
            }
            let url = "https://gateway.ipfs.io/ipfs/" + json.value.cid + "/" + json.value.files[0].name;
            console.log("<<< uploadMeta", url);
            return url;
        },
        async getEvents() {
            if (window.ethereum && this.contractaddress) {
                this.loading = true;
                try {
                    let provider = new ethers.BrowserProvider(window.ethereum);
                    let accounts = await provider.listAccounts();
                    if (accounts && accounts.length > 0) {
                        let signer = accounts[0];
                        let contract = new ethers.Contract(this.contractaddress, NFT_DEMO.abi, signer);
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