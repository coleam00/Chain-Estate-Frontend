import { Grid, Typography, Card} from '@mui/material';
import clsx from 'clsx';
import { useEffect } from "react";
;
import styles from '../styles/marketplace.module.css';

export default function EmberCheckout(props) {
    useEffect(() => {
        !function(e){if(window.EmbrCheckout && window.EmbrCheckout.init){return window.EmbrCheckout.init(e)}const c=document.createElement("script");c.type="module",c.onload=(()=>window.EmbrCheckout.init(e)),c.src="https://static.embr.org/checkout.es.js",document.querySelector("head").appendChild(c)}({"debug":false,"element":"#checkout","config":{"chain":"bsc","exchange":"pancakeswap","lpAddress":"0x1004d5813239B5fB630af316280b09FEF96389B8","token":{"address":"0xe3647FB6024355dBC93133e6c4c74277366A4bdC","name":"ChainEstateTokenV2","symbol":"CHES","decimals":18,"logoUrl":"https://s2.coinmarketcap.com/static/img/coins/64x64/18532.png","tax":0.05}}});
    }, [])

    return (
        <Grid container justifyContent="center" spacing={5} className={clsx(styles.emberGrid, styles.airdropGridBackground, props.useDarkTheme ? styles.airdropGridShadowDark : styles.airdropGridShadowLight)}>
            <Grid item xs={3} className={styles.spacingGrid}></Grid>
                <Grid item xs={5} className={styles.headerGrid}>
                    <Typography variant="h4" className={clsx(styles.header, props.useDarkTheme ? styles.darkHeader : styles.lightHeader)}>
                        Purchase CHES with Ember
                    </Typography>
                </Grid>
            <Grid item xs={3} className={styles.spacingGrid}></Grid>

            <Grid item xs={12} id="checkout"></Grid>
        </Grid>
    )
}