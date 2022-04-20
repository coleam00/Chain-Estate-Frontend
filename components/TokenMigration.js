import Image from 'next/image';
import { Grid, Typography, Button, CircularProgress, Card} from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import clsx from 'clsx';
import { useState, useEffect } from "react";
import { useEthers, useTokenBalance, useContractFunction } from "@usedapp/core";
import { constants, utils, ethers } from "ethers";
import { Contract } from "@ethersproject/contracts";

import CHESTokenV1 from "../contracts/ChainEstateTokenV1.json";
import CHESTokenClaim from "../contracts/ChainEstateTokenClaim.json";
import styles from '../styles/marketplace.module.css';
import chainConfig from "../chain-config.json";
import tokenLogo from '../public/TokenLogo.png';

export default function TokenMigration(props) {
    const { account, chainId } = useEthers();
    const networkName = "binance";
    const CHESAddressV1 = chainId ? chainConfig["CHESTokenAddresses"][networkName] : constants.AddressZero;
    const CHESAddressV2 = chainId ? chainConfig["CHESV2TokenAddresses"][networkName] : constants.AddressZero;
    const CHESTokenClaimAddress = chainId ? chainConfig["CHESTokenClaimAddresses"][networkName] : constants.AddressZero;
    const tokenBalanceV1 = useTokenBalance(CHESAddressV1, account);
    const tokenBalanceV2 = useTokenBalance(CHESAddressV2, account);
    const isConnected = account !== undefined;

    const chesV1ABI = CHESTokenV1.abi;
    const CHESTokenClaimABI = CHESTokenClaim.abi;
    

    const chesV1Interface = new utils.Interface(chesV1ABI);
    const chesV1Contract = new Contract(CHESAddressV1, chesV1Interface);
    const chesTokenClaimInterface = new utils.Interface(CHESTokenClaimABI);
    const chesTokenClaimContract = new Contract(CHESTokenClaimAddress, chesTokenClaimInterface);

    const { send: approveV1CHESTransfer, state: approveV1CHESTransferState } =
        useContractFunction(chesV1Contract, "approve", {
            transactionName: "Approve the CHES DApp to spend V1 CHES tokens for the v2 migration",
    })

    const { send: claimV2CHESTokens, state: claimV2CHESTokensState } =
        useContractFunction(chesTokenClaimContract, "claimV2CHESTokens", {
            transactionName: "Claim V2 CHES tokens",
    })

    const [approvingV1Transfer, setApprovingV1Transfer] = useState(false);
    const [v1TransferApproved, setV1TransferApproved] = useState(false);
    const [claimingTokens, setClaimingTokens] = useState(false);
    const [showClaimSuccess, setShowClaimSuccess] = useState(false);
    const [showClaimFail, setShowClaimFail] = useState(false);
    const [showPendingTransaction, setShowPendingTransaction] = useState(false);
    const [claimErrorText, setClaimErrorText] = useState("");
    const [transactionHash, setTransactionHash] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [processingMessage, setProcessingMessage] = useState("");

    const tokenClaimAction = () => {
        if (!v1TransferApproved) {
            setApprovingV1Transfer(true);
            approveV1CHESTransfer(CHESTokenClaimAddress, tokenBalanceV1);   
        }
        else {
            setClaimingTokens(true);
            claimV2CHESTokens();
        }
    }

    useEffect(() => {
        console.log(approveV1CHESTransferState);
        if (approveV1CHESTransferState.status === "Success") {
            setApprovingV1Transfer(false); 
            setSuccessMessage("Approved V1 CHES Token Transfer!");
            setShowClaimSuccess(true);
            setV1TransferApproved(true);
            setShowClaimFail(false);
            setShowPendingTransaction(false);
            setTransactionHash(approveV1CHESTransferState.transaction.hash);
        }
        else if (approveV1CHESTransferState.status === "Exception") {
            setApprovingV1Transfer(false);
            setShowClaimSuccess(false);
            setV1TransferApproved(false);
            setShowClaimFail(true);
            setShowPendingTransaction(false);
            setClaimErrorText(approveV1CHESTransferState.errorMessage);
        }
        else if (approveV1CHESTransferState.status === "Mining") {
            setShowPendingTransaction(true);
            setProcessingMessage("Approving V1 CHES Token Transfer.");
            setTransactionHash(approveV1CHESTransferState.transaction.hash);
        }
    }, [approveV1CHESTransferState])

    useEffect(() => {
        console.log(claimV2CHESTokensState);
        if (claimV2CHESTokensState.status === "Success") {
            setClaimingTokens(false);
            setSuccessMessage("Claimed V2 CHES Tokens Successfully!!");
            setShowClaimSuccess(true);
            setShowClaimFail(false);
            setShowPendingTransaction(false);
            setTransactionHash(claimV2CHESTokensState.transaction.hash);
        }
        else if (claimV2CHESTokensState.status === "Exception") {
            setClaimingTokens(false);
            setShowClaimSuccess(false);
            setShowClaimFail(true);
            setShowPendingTransaction(false);
            setClaimErrorText(claimV2CHESTokensState.errorMessage);
        }
        else if (claimV2CHESTokensState.status === "Mining") {
            setShowPendingTransaction(true);
            setProcessingMessage("Claiming V2 CHES Tokens.");
            setTransactionHash(claimV2CHESTokensState.transaction.hash);
        }
    }, [claimV2CHESTokensState])

    return (
        <Grid container justifyContent="center" className={clsx(styles.airdropGrid, !isConnected ? styles.airdropGridBeforeLoad : "", isConnected ? styles.airdropGridBackground : "", isConnected && props.useDarkTheme ? styles.airdropGridShadowDark : isConnected ? styles.airdropGridShadowLight : "")}>
            <Grid item xs={3} className={styles.spacingGrid}></Grid>
                <Grid item xs={5} className={styles.headerGrid}>
                    <Typography variant="h4" className={clsx(styles.header, props.useDarkTheme ? styles.darkHeader : styles.lightHeader)}>
                        Chain Estate DAO V2 Token Migration
                    </Typography>
                </Grid>
            <Grid item xs={3} className={styles.spacingGrid}></Grid>
            {
                !isConnected && (
                    <Grid item xs={10} className="text-center mt-5">
                        <Typography variant="h5" component="div">
                            Connect Your Wallet in the Navigation Menu to Migrate your CHES tokens to V2
                        </Typography>
                    </Grid>
                )
            }
            {
                isConnected && (
                    <Grid item lg={6} md={8} sm={10} xs={12} className={styles.airDropGridItem}>
                        <Card className={clsx(styles.customCard, props.useDarkTheme ? styles.airDropCardDark : styles.airDropCardLight)}>
                            <Snackbar open={showClaimSuccess} autoHideDuration={6000} onClose={() => {setShowClaimSuccess(false)}}>
                                <MuiAlert elevation={6} variant="filled" onClose={() => {setShowClaimSuccess(false)}} severity="success" sx={{ width: '100%' }} >
                                    {successMessage} Transaction hash: <a className={styles.transactionHashLink} href={`https://bscscan.com/tx/${transactionHash}`} target="_blank" rel="noreferrer" >{transactionHash}</a>
                                </MuiAlert>
                            </Snackbar>
                            <Snackbar open={showClaimFail} autoHideDuration={6000} onClose={() => {setShowClaimFail(false)}}>
                                <MuiAlert elevation={6} variant="filled" onClose={() => {setShowClaimFail(false)}} severity="error" sx={{ width: '100%' }} >
                                    Transaction Canceled: {claimErrorText}
                                </MuiAlert>
                            </Snackbar>
                            <Snackbar open={showPendingTransaction} autoHideDuration={20000} onClose={() => {setShowPendingTransaction(false)}}>
                                <MuiAlert elevation={6} variant="filled" onClose={() => {setShowPendingTransaction(false)}} severity="info" sx={{ width: '100%' }} >
                                    {processingMessage} Transaction hash: <a className={styles.transactionHashLink} href={`https://bscscan.com/tx/${transactionHash}`} target="_blank" rel="noreferrer" >{transactionHash}</a>
                                </MuiAlert>
                            </Snackbar>
                            <Grid container justifyContent="center" className={styles.airDropContentGrid}>
                                <Grid item xs={3} className={styles.airDropTokenLogoGrid}>
                                    <Image src={tokenLogo} layout="responsive" />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button size="large" variant="contained" color="primary" onClick={() => tokenClaimAction()}
                                        className={clsx(styles.claimAirdropBtn, props.useDarkTheme ? styles.btnDark : styles.btnLight)} disabled={claimingTokens}>
                                        {!approvingV1Transfer && !v1TransferApproved && "Start V2 CHES Migration"}
                                        {approvingV1Transfer && <CircularProgress size={18} color="secondary"/>} 
                                        {approvingV1Transfer && <>&nbsp; Approving</>}
                                        {!claimingTokens && v1TransferApproved && "Finish V2 CHES Migration"}
                                        {claimingTokens && <CircularProgress size={18} color="secondary"/>} 
                                        {claimingTokens && <>&nbsp; Claiming</>}
                                    </Button>
                                </Grid>
                                <Grid item xs={10} md={5} className={clsx(styles.tokenClaimV1BalanceGrid, styles.gridTopMargin)}>
                                    <Card className={styles.tokenClaimContentCard}>
                                        V1 Balance: {tokenBalanceV1 ? Number((+ethers.utils.formatEther(BigInt(tokenBalanceV1._hex).toString(10))).toFixed(2)).toLocaleString() : 0} CHES
                                    </Card>
                                </Grid>
                                <Grid item xs={10} md={5} className={clsx(styles.tokenClaimV2BalanceGrid, styles.gridTopMargin)}>
                                    <Card className={styles.tokenClaimContentCard}>
                                        V2 Balance: {tokenBalanceV2 ? Number((+ethers.utils.formatEther(BigInt(tokenBalanceV2._hex).toString(10))).toFixed(2)).toLocaleString() : 0} CHES
                                    </Card>
                                </Grid>
                            </Grid>
                        </Card>
                    </Grid>
                )
            }
        </Grid>
    )
}