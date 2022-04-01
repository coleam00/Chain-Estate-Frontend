import { Grid, Typography } from '@mui/material';
import clsx from 'clsx';
import { useEthers, useTokenBalance } from "@usedapp/core";
import { constants } from "ethers";

import styles from '../styles/marketplace.module.css';
import chainConfig from "../chain-config.json";

import Navigation from '../components/Navigation';
import CreateNFTs from "../components/CreateNFTs";

export default function CreateNFTsPage(props) {
    const { account, chainId } = useEthers();
    const networkName = chainId ? chainConfig["chainIds"][chainId] : "Not Connected";
    const CHESAddress = chainId ? chainConfig["CHESTokenAddresses"][networkName] : constants.AddressZero;
    const tokenBalance = useTokenBalance(CHESAddress, account);
    const isConnected = account !== undefined;

    return (
        <>
        <Navigation useDarkTheme={props.useDarkTheme} setUseDarkTheme={props.setUseDarkTheme} />
        <Grid container justifyContent="center" className={styles.mainGrid}>
            <Grid item xs={4} className={styles.spacingGrid}></Grid>
            <Grid item xs={4} className={styles.headerGrid}>
                <Typography variant="h4" className={clsx(styles.header, props.useDarkTheme ? styles.darkHeader : styles.lightHeader)}>
                    Create Chain Estate DAO NFTs
                </Typography>
            </Grid>
            <Grid item xs={4} className={styles.spacingGrid}></Grid>
            
            <CreateNFTs {...props} />
        </Grid>
        </>
    )
}