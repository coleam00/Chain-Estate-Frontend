import Image from 'next/image';
import { Grid, Typography, Button, CircularProgress, Card} from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import clsx from 'clsx';
import { useState, useEffect } from "react";
import { useEthers, useTokenBalance, useContractFunction, useCall } from "@usedapp/core";
import { constants, utils, ethers } from "ethers";
import { Contract } from "@ethersproject/contracts";
import { IconContext } from "react-icons";
import { ImCheckmark } from "react-icons/im";
import { FcCancel } from "react-icons/fc";

import CHESAirdrops from "../contracts/ChainEstateAirDrop.json";
import styles from '../styles/marketplace.module.css';
import chainConfig from "../chain-config.json";
import tokenLogo from '../public/TokenLogo.png';

async function useAirdropLive(
    airdropContract
  ) {
    const { value, error } =
        useCall(
            airdropContract && {
            contract: airdropContract, // instance of called contract
            method: "airDropActive", // Method to be called
            args: [], // Method arguments - address to be checked for balance
          }
      ) ?? {};
    if(error) {
      console.error(error.message)
      return undefined
    }
    return value?.[0]
  }

export default function Airdrops(props) {
    const { account, chainId } = useEthers();
    const networkName = "binance";
    const CHESAddress = chainId ? chainConfig["CHESV2TokenAddresses"][networkName] : constants.AddressZero;
    const CHESAirdropAddress = chainId ? chainConfig["CHESV2AirDropAddresses"][networkName] : constants.AddressZero;
    const tokenBalance = useTokenBalance(CHESAddress, account);
    const isConnected = account !== undefined;

    const airdropAbi = CHESAirdrops.abi;
    const airdropInterface = new utils.Interface(airdropAbi);
    const airdropContract = new Contract(CHESAirdropAddress, airdropInterface);

    const { send: claimAirdrop, state: claimAirdropState } =
        useContractFunction(airdropContract, "claimAirDrop", {
            transactionName: "Claim your Chain Estate DAO air drop rewards!",
    })

    const airDropActive = useAirdropLive(airdropContract);
    const [airDropIsActive, setAirDropIsActive] = useState(false);
    const [claimingAirdropRewards, setClaimingAirdropRewards] = useState(false);
    const [loadedAirdropActive, setLoadedAirdropActive] = useState(false);
    const [showClaimSuccess, setShowClaimSuccess] = useState(false);
    const [showClaimFail, setShowClaimFail] = useState(false);
    const [showPendingTransaction, setShowPendingTransaction] = useState(false);
    const [claimErrorText, setClaimErrorText] = useState("");
    const [transactionHash, setTransactionHash] = useState("");

    useEffect(() => {
        airDropActive.then(airDropActiveResult => {
            if (airDropActiveResult != undefined) {
                setAirDropIsActive(airDropActiveResult);
                setLoadedAirdropActive(true);
            }
        });
    }, [airDropActive])

    const startAirdropClaim = () => {
        setClaimingAirdropRewards(true);
        claimAirdrop();   
    }

    useEffect(() => {
        console.log(claimAirdropState);
        if (claimAirdropState.status === "Success") {
            setClaimingAirdropRewards(false);
            setShowClaimSuccess(true);
            setShowClaimFail(false);
            setShowPendingTransaction(false);
            setTransactionHash(claimAirdropState.transaction.hash);
        }
        else if (claimAirdropState.status === "Exception") {
            setClaimingAirdropRewards(false);
            setShowClaimSuccess(false);
            setShowClaimFail(true);
            setShowPendingTransaction(false);
            setClaimErrorText(claimAirdropState.errorMessage);
        }
        else if (claimAirdropState.status === "Mining") {
            setShowPendingTransaction(true);
            setTransactionHash(claimAirdropState.transaction.hash);
        }
    }, [claimAirdropState])

    return (
        <Grid container justifyContent="center" className={clsx(styles.airdropGrid, !isConnected || !loadedAirdropActive ? styles.airdropGridBeforeLoad : "", isConnected && loadedAirdropActive ? styles.airdropGridBackground : "", isConnected && loadedAirdropActive && props.useDarkTheme ? styles.airdropGridShadowDark : isConnected && loadedAirdropActive ? styles.airdropGridShadowLight : "")}>
            <Grid item xs={4} className={styles.spacingGrid}></Grid>
                <Grid item xs={4} className={styles.headerGrid}>
                    <Typography variant="h4" className={clsx(styles.header, props.useDarkTheme ? styles.darkHeader : styles.lightHeader)}>
                        Chain Estate DAO Airdops
                    </Typography>
                </Grid>
            <Grid item xs={4} className={styles.spacingGrid}></Grid>
            {
                !isConnected && (
                    <Grid item xs={10} className="text-center mt-5">
                        <Typography variant="h5" component="div">
                            Connect Your Wallet in the Navigation Menu to Claim Airdrop Rewards
                        </Typography>
                    </Grid>
                )
            }
            {
                isConnected && !loadedAirdropActive && (
                    <Grid item xs={10} className="text-center mt-5">
                        <CircularProgress size={80} color="secondary" className={styles.loadingAirdropContent} />
                    </Grid>
                )
            }
            {
                isConnected && loadedAirdropActive && (
                    <Grid item lg={6} md={8} sm={10} xs={12} className={styles.airDropGridItem}>
                        <Card className={clsx(styles.customCard, props.useDarkTheme ? styles.airDropCardDark : styles.airDropCardLight)}>
                            <Snackbar open={showClaimSuccess} autoHideDuration={6000} onClose={() => {setShowClaimSuccess(false)}}>
                                <MuiAlert elevation={6} variant="filled" onClose={() => {setShowClaimSuccess(false)}} severity="success" sx={{ width: '100%' }} >
                                    CHES Airdrop rewards claimed successfully!! Transaction hash: <a className={styles.transactionHashLink} href={`https://bscscan.com/tx/${transactionHash}`} target="_blank" rel="noreferrer" >{transactionHash}</a>
                                </MuiAlert>
                            </Snackbar>
                            <Snackbar open={showClaimFail} autoHideDuration={6000} onClose={() => {setShowClaimFail(false)}}>
                                <MuiAlert elevation={6} variant="filled" onClose={() => {setShowClaimFail(false)}} severity="error" sx={{ width: '100%' }} >
                                    Airdrop Claim Failed: {claimErrorText.replace("made to close", "made too close")}
                                </MuiAlert>
                            </Snackbar>
                            <Snackbar open={showPendingTransaction} autoHideDuration={20000} onClose={() => {setShowPendingTransaction(false)}}>
                                <MuiAlert elevation={6} variant="filled" onClose={() => {setShowPendingTransaction(false)}} severity="info" sx={{ width: '100%' }} >
                                    Processing airdrop claim. Transaction hash: <a className={styles.transactionHashLink} href={`https://bscscan.com/tx/${transactionHash}`} target="_blank" rel="noreferrer" >{transactionHash}</a>
                                </MuiAlert>
                            </Snackbar>
                            <Grid container justifyContent="center" className={styles.airDropContentGrid}>
                                <Grid item xs={3} className={styles.airDropTokenLogoGrid}>
                                    <Image src={tokenLogo} layout="responsive" />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button size="large" variant="contained" color="primary" onClick={() => startAirdropClaim()}
                                        className={clsx(styles.claimAirdropBtn, props.useDarkTheme ? styles.btnDark : styles.btnLight)} disabled={claimingAirdropRewards}>
                                        {claimingAirdropRewards && <CircularProgress size={18} color="secondary"/>} 
                                        {claimingAirdropRewards ? <>&nbsp; Claiming</> : "Claim Airdrop"}
                                    </Button>
                                </Grid>
                                <Grid item xs={10} md={5} className={clsx(styles.airdropBalanceGrid, styles.gridTopMargin)}>
                                    <Card className={styles.airdropContentCard}>
                                        Balance: {tokenBalance ? Number((+ethers.utils.formatEther(BigInt(tokenBalance._hex).toString(10))).toFixed(2)).toLocaleString() : 0} CHES
                                    </Card>
                                </Grid>
                                <Grid item xs={10} md={5} className={styles.gridTopMargin}>
                                    <Card className={styles.airdropContentCard}>
                                        {
                                            airDropIsActive && (
                                                <IconContext.Provider
                                                value={{ color: 'lime' }}
                                                >
                                                <div className={styles.greenText}>
                                                        <ImCheckmark className={styles.airdropActiveIcon} /> Airdrop is Active!
                                                    </div>
                                            </IconContext.Provider>

                                            )
                                        }
                                        {
                                            !airDropIsActive && (
                                                <div className={styles.redText}>
                                                    <FcCancel className={styles.airdropActiveIcon} /> Airdrop not Active
                                                </div>
                                            )
                                        }
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