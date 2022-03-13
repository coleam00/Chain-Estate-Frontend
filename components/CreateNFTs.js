import { Grid, Typography, Button, Card, CardContent, CardActions, TextField, Input, CircularProgress } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import clsx from 'clsx';
import { useState, useEffect } from "react";
import { useEthers, useContractFunction } from "@usedapp/core";
import { constants, utils, ethers } from "ethers";
import { Contract } from "@ethersproject/contracts";
import { create as ipfsHttpClient } from 'ipfs-http-client';

import styles from '../styles/marketplace.module.css';
import CHESNFT from "../contracts/ChainEstateNFT.json";
import chainConfig from "../chain-config.json";

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0');

export default function CreateNFTs(props) {
    const { account, chainId } = useEthers();
    const networkName = chainId ? chainConfig["chainIds"][chainId] : "Not Connected";
    const CHESNFTAddress = chainId ? chainConfig["CHESNFTAddresses"][networkName] : constants.AddressZero;

    const nftAbi = CHESNFT.abi;
    const nftInterface = new utils.Interface(nftAbi);
    const nftContract = new Contract(CHESNFTAddress, nftInterface);

    // const [fileUrl, setFileUrl] = useState("https://bafybeicsrjjqj6zoivajhmvjezuoa2oweldy2j5hvjd3vff5m4gf5bzdhu.ipfs.infura-ipfs.io/");
    const [fileUrl, setFileUrl] = useState("");
    const [inputError, setInputError] = useState("");
    const [NFTPrice, setNFTPrice] = useState(0.0);
    const [NFTName, setNFTName] = useState("");
    const [NFTDescription, setNFTDescription] = useState("");
    const [propertyId, setPropertyId] = useState(0);
    const [creatingNFT, setCreatingNFT] = useState(false);
    const [showMintSuccess, setShowMintSuccess] = useState(false);
    const [showTransactionCancel, setShowTransactionCancel] = useState(false);

    const isConnected = account !== undefined;

    const { send: createNFT, state: createNFTState } =
        useContractFunction(nftContract, "createToken", {
            transactionName: "Mint a Chain Estate DAO NFT",
    })

    async function onFileChange(e) {
        const file = e.target.files[0];
        try {
          const added = await client.add(
            file,
            {
              progress: (prog) => console.log(`received: ${prog}`)
            }
          )
          const url = `https://ipfs.infura.io/ipfs/${added.path}`;
          setFileUrl(url);
        } catch (error) {
          console.log('Error uploading file: ', error);
        }  
      }
  
      async function uploadToIPFS() {
        if (!NFTName || !NFTDescription || !NFTPrice || !fileUrl) return
        /* first, upload to IPFS */
        const data = JSON.stringify({
            NFTName, NFTDescription, image: fileUrl
        });
        try {
          const added = await client.add(data);
          const url = `https://ipfs.infura.io/ipfs/${added.path}`;
          /* after file is uploaded to IPFS, return the URL to use it in the transaction */
          return url;
        } catch (error) {
          console.log('Error uploading file: ', error);
        }  
      }

    async function createCHESNFT() {
        if (propertyId >= 0 && NFTPrice > 0 && NFTName != "" && NFTDescription != "") {
            const url = await uploadToIPFS();
            createNFT(url, propertyId);
            setCreatingNFT(true);
        }
    }

    useEffect(() => {
        console.log(createNFTState);
        if (createNFTState.status === "Success") {
            setCreatingNFT(false);
            setShowMintSuccess(true);
            setShowTransactionCancel(false);
        }
        else if (createNFTState.status === "Exception") {
            setCreatingNFT(false);
            setShowTransactionCancel(true);
            setShowMintSuccess(false);
        }
    }, [createNFTState])

    const isNumeric = stringToTest => {
        return !isNaN(stringToTest) && !isNaN(parseFloat(stringToTest));
    }

    const updateNFTPrice = event => {
        const newAmount = event.target.value;

        if (isNumeric(+newAmount) || newAmount == ".") {
            setNFTPrice(event.target.value);
        }
        if (newAmount > 0.0) {
            setInputError("");
        }
    }

    return (
        <Grid container justifyContent="center" className={styles.marketplaceFunctionGrid}>
            <Snackbar open={showMintSuccess} autoHideDuration={6000} onClose={() => {setShowMintSuccess(false)}}>
                <MuiAlert elevation={6} variant="filled" onClose={() => {setShowMintSuccess(false)}} severity="success" sx={{ width: '100%' }} >
                    NFT Minted Successfully!
                </MuiAlert>
            </Snackbar>
            <Snackbar open={showTransactionCancel} autoHideDuration={6000} onClose={() => {setShowTransactionCancel(false)}}>
                <MuiAlert elevation={6} variant="filled" onClose={() => {setShowTransactionCancel(false)}} severity="error" sx={{ width: '100%' }} >
                    Transaction Canceled
                </MuiAlert>
            </Snackbar>
            {
                !isConnected && (
                    <Grid item xs={10} className="text-center">
                        <Typography variant="h5" component="div">
                            Developer Portal to Mint Chain Estate DAO NFTs. Developers - Connect Wallet First
                        </Typography>
                    </Grid>
                )
            }
            {
                isConnected && (
                    <>
                    <Grid item xs={3} className={styles.spacingGrid}></Grid>
                    <Grid item xs={6} className={styles.connectGrid}>
                        <Card className={clsx(styles.customCard, props.useDarkTheme ? styles.customCardDark : styles.customCardLight)}>
                            <div>
                            <CardContent className={styles.cardContentDiv}>
                                <Grid container justifyContent="center">
                                    <Grid item xs={4}>
                                        <TextField error={inputError != ""} label="NFT Name" helperText={inputError}
                                            value={NFTName} onChange={(e) => {setNFTName(e.target.value)}} className={styles.CHESPurchaseInput} />
                                    </Grid>
                                    <Grid item xs={4}>
                                        <TextField error={inputError != ""} label="Price in CHES" helperText={inputError}
                                            value={NFTPrice} onChange={updateNFTPrice} className={styles.CHESPurchaseInput} />
                                    </Grid>
                                    <Grid item xs={4}>
                                        <TextField error={inputError != ""} label="Property ID" helperText={inputError}
                                            value={propertyId} onChange={(e) => {setPropertyId(e.target.value)}} className={styles.CHESPurchaseInput} />
                                    </Grid>
                                    <Grid item xs={8}>
                                        <TextField fullWidth error={inputError != ""} label="NFT Description" helperText={inputError}
                                            value={NFTDescription} onChange={(e) => {setNFTDescription(e.target.value)}} className={styles.CHESPurchaseInput} />
                                    </Grid>
                                    <Grid item xs={8}>
                                        <label htmlFor="contained-button-file">
                                            <Input accept="image/*" id="contained-button-file" onChange={onFileChange} className={styles.fileInput} type="file" />
                                            <Button variant="contained" component="span">
                                                Upload NFT Image
                                            </Button>
                                        </label>
                                    </Grid>
                                    <Grid item xs={8}>
                                        {
                                        fileUrl && (
                                            <img className="rounded mt-4" width="250" src={fileUrl} />
                                        )
                                        }
                                    </Grid>
                                </Grid>
                            </CardContent>
                            <CardActions>
                                <Button size="small" variant="contained" color="primary" onClick={createCHESNFT}
                                    className={clsx(styles.cardBtn, props.useDarkTheme ? styles.btnDark : styles.btnLight)}
                                    disabled={creatingNFT || NFTPrice <= 0.0 || fileUrl == "" || NFTName == "" || NFTDescription == "" || propertyId == 0}>
                                    {creatingNFT && <CircularProgress size={18} color="secondary"/>} 
                                    {creatingNFT ? <>&nbsp; Creating NFT</> : "Create NFT"}
                                </Button>
                            </CardActions>
                            </div>
                        </Card>
                    </Grid>
                    <Grid item xs={3} className={styles.spacingGrid}></Grid>
                    </>
                )
            }
        </Grid>
    )
}