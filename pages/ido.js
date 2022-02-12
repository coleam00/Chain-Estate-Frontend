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
            <Grid item xs={8} className={styles.comingSoonText}>
                <Typography variant="h5">
                    Coming soon...
                </Typography>
            </Grid>
            <Grid item xs={8} className={styles.launchText}>
                <Typography variant="h6">
                    When Chain Estate DAO officially launches in Q1 of 2022, you can visit PankcakeSwap
                    to participate in the Initial Dex Offering (IDO)! The IDO will begin
                    on February 22nd of 2022 along with the launch of the CHES token. This is when you will
                    first be able to purchase the token for the project.
                </Typography>
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