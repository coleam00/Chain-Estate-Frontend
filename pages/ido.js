import { Grid, Typography, Button, Card, CardContent, CardActions, TextField } from '@mui/material';
import clsx from 'clsx';
import { useState, useEffect } from "react";
import { useEthers, useTokenBalance, useContractFunction } from "@usedapp/core";
import { constants, utils } from "ethers";
import { Contract } from "@ethersproject/contracts";

import styles from '../styles/presale.module.css';
import CHESPreSale from "../contracts/ChainEstatePreSale.json";
import chainConfig from "../chain-config.json";

export default function PreSale(props) {
    const { account, activateBrowserWallet, deactivate, chainId } = useEthers();
    const networkName = chainId ? chainConfig["chainIds"][chainId] : "Not Connected";
    const tokenAddress = chainId ? chainConfig["CHESTokenAddresses"][networkName] : constants.AddressZero;
    const preSaleAddress = chainId ? chainConfig["CHESPreSaleAddresses"][networkName] : constants.AddressZero;
    
    // console.log(networkName);
    // console.log(chainId);
    // console.log(tokenAddress);
    // console.log(preSaleAddress);

    const tokenBalance = useTokenBalance(tokenAddress, account);
    const BNBToCHESRate = 40000;
    const purchaseCapUSDollars = 9000000;

    // console.log(tokenBalance);
    // console.log(account);

    const PreSaleABI = CHESPreSale.abi;
    
    const preSaleInterface = new utils.Interface(PreSaleABI);
    const preSaleContract = new Contract(preSaleAddress, preSaleInterface);

    const { send: purchaseCHESTokens, state: preSalePurchaseState } =
        useContractFunction(preSaleContract, "purchaseCHESTokens", {
            transactionName: "Purchase CHES Tokens",
    })

    const isConnected = account !== undefined;

    const [coinAmount, setCoinAmount] = useState(0);
    const [inputError, setInputError] = useState("");

    const isNumeric = stringToTest => {
        return !isNaN(stringToTest) && !isNaN(parseFloat(stringToTest));
    }

    const updateCoinAmount = event => {
        const newAmount = event.target.value;

        if (isNumeric(+newAmount) || newAmount == ".") {
            setCoinAmount(event.target.value);
        }
        if (coinAmount > 0.0 && ((coinAmount * BNBToCHESRate) / 100.0) <= purchaseCapUSDollars) {
            setInputError("");
        }
    }

    const calculateCHESTokens = () => {
        if (coinAmount == "." || coinAmount == "") {
            return 0;
        }
        else {
            return parseFloat(coinAmount) * BNBToCHESRate;
        }
    }

    const startPurchaseCHESTokens = () => {
        if (coinAmount <= 0.0) {
            setInputError("You must send more than 0 BNB.");
        }
        else if (((coinAmount * BNBToCHESRate) / 100.0) > purchaseCapUSDollars) {
            setInputError("You cannot purchase more than 3% of the total pre-sale supply.");
        }
        else {
            purchaseCHESTokens({value: utils.parseEther(coinAmount)});
        }
    }

    useEffect(() => {
        console.log(preSalePurchaseState);
    }, [preSalePurchaseState])

    return (
        <Grid container justifyContent="center" className={styles.mainGrid}>
            <Grid item xs={4} className={styles.spacingGrid}></Grid>
            <Grid item xs={3} className={styles.headerGrid}>
                <Typography variant="h4" className={clsx(styles.header, props.useDarkTheme ? styles.darkHeader : styles.lightHeader)}>
                    Initial Dex Offering
                </Typography>
            </Grid>
            <Grid item xs={4} className={styles.spacingGrid}></Grid>
            <Grid item xs={8} className={styles.haveLaunchedText}>
                <Typography variant="h5">
                    Chain Estate DAO has officially launched!
                </Typography>
            </Grid>
            <Grid item xs={8} className={styles.launchText}>
                <Typography variant="h6">
                    You can visit PancakeSwap, the largest decentralized exchange on the Binance Smart Chain, to
                    swap BNB for the Chain Estate DAO token (CHES). The token price will likely be extremely volatile!  
                    You will need to set your slippage on PancakeSwap to at least 6% to account for the tax, but likely higher (we recommend at least 10%-15%).
                    If you get an error message, that could mean one of two things:  You are trying to buy more than 6,000,000 tokens, or your slippage is not high enough.
                    We are limiting each investor initially to 2% of the total CHES tokens in the PancakeSwap liquidity, which is that 6,000,000 number.
                </Typography>
            </Grid>
            <Grid item xs={8} className={styles.swapBtnGrid}>
                <Button href="https://pancakeswap.finance/swap?outputCurrency=0x31832D10f68D3112d847Bd924331F3d182d268C4" target="_blank" rel="noreferrer" variant="contained" 
                className={clsx(styles.swapBtn, props.useDarkTheme ? styles.btnLight : styles.btnDark)}>
                    Swap for CHES on PancakeSwap
                </Button>
            </Grid>

            {/*
            <Grid item xs={6} className={styles.connectGrid}>
                <Card className={clsx(styles.customCard, props.useDarkTheme ? styles.customCardDark : styles.customCardLight)}>
                    <div>
                    <CardContent className={styles.cardContentDiv}>
                        <Grid container justifyContent="center">
                            <Grid item xs={12}>
                                <Typography variant="h5" component="div">
                                    Purchase CHES Tokens with BNB
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <div className={styles.connectBtn}>
                                    {isConnected ? (
                                        <Button size="small" variant="contained" color="primary" onClick={deactivate}
                                            className={props.useDarkTheme ? styles.connectBtnDark : styles.connectBtnLight}>
                                            Disconnect
                                        </Button>
                                    ) : (
                                        <Button size="small" variant="contained" color="primary" onClick={() => activateBrowserWallet()}
                                            className={props.useDarkTheme ? styles.connectBtnDark : styles.connectBtnLight}>
                                            Connect
                                        </Button>
                                    )
                                    }
                                </div>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField error={inputError != ""} label="BNB" defaultValue="0.0" helperText={inputError}
                                    value={coinAmount} onChange={updateCoinAmount} className={styles.CHESPurchaseInput} />
                            </Grid>
                        </Grid>
                    </CardContent>
                    <CardActions>
                        <Button size="small" variant="contained" color="secondary" onClick={startPurchaseCHESTokens}
                            className={clsx(styles.cardBtn, props.useDarkTheme ? styles.btnDark : styles.btnLight)}>
                            Purchase {calculateCHESTokens()} CHES Tokens
                        </Button>
                    </CardActions>
                    </div>
                </Card>
            </Grid>
            */}
        </Grid>
    )
}