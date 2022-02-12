import { Grid, Typography } from '@mui/material';
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { VerticalTimeline, VerticalTimelineElement }  from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import styles from '../styles/Home.module.css';

export default function Roadmap(props) {
    gsap.registerPlugin(ScrollTrigger);

    const darkThemePrimary = "#1649ff";
    const lightThemePrimary = "#70c1ff";
    const roadmapHeaderRef = useRef();
  
    // Loads animations for elements of the page.
    useEffect(() => {
      gsap.from(roadmapHeaderRef.current, { opacity: 0, duration: 1.5, scrollTrigger: { trigger: "#roadmapHeader", start: "bottom bottom" } });
    }, [])

    return (
        <Grid container id="roadmap" justifyContent="center" alignItems="center">
          <Grid item xs={12}>
            <Typography variant="h4" id="roadmapHeader" ref={roadmapHeaderRef} className={styles.roadmapHeader}>
              Chain Estate DAO Roadmap
            </Typography>
          </Grid>

          <VerticalTimeline className={clsx(styles.verticalTimelineDiv, props.useDarkTheme ? "timeline-dark-theme" : "timeline-light-theme")}>
            {/* ~~~~~~~~~~~~~~~~~~~ Q1 2022 ~~~~~~~~~~~~~~~~~~ */}
            <VerticalTimelineElement
              className="vertical-timeline-element-right"
              contentStyle={{ background: props.useDarkTheme ? darkThemePrimary : lightThemePrimary, color: props.useDarkTheme ? '#fff' : '#fff' }}
              contentArrowStyle={{ borderRight: `7px solid ${props.useDarkTheme ? darkThemePrimary : lightThemePrimary}` }}
              date="Q1 2022"
              iconStyle={{ background: props.useDarkTheme ? darkThemePrimary : lightThemePrimary, color: props.useDarkTheme ? '#fff' : '#000' }}
              icon={<ArrowDownwardIcon />}
            >
              <Typography variant="p">
                <ArrowForwardIcon /> Release of the Chain Estate DAO Smart Contracts
              </Typography>
              <br/>
              <Typography variant="p">
                <ArrowForwardIcon /> Whitepaper and Discord Server Creation
              </Typography>
              <br/>
              <Typography variant="p">
                <ArrowForwardIcon /> Get listed on PancakeSwap
              </Typography>
              <br/>
              <Typography variant="p">
                <ArrowForwardIcon />  Initial Dex Offering
              </Typography>
              <br/>
              <Typography variant="p">
                <ArrowForwardIcon /> Start the Audit Process by Certik
              </Typography>
              <br/>
              <Typography variant="p">
                <ArrowForwardIcon /> Developer Liquidity Lock Up
              </Typography>
              <br/>
              <Typography variant="p">
                <ArrowForwardIcon /> First Token Airdrop
              </Typography>
              <br/>
              <Typography variant="p" className={styles.lastTimelineElement}>
                <ArrowForwardIcon /> Initial Marketing Campaigns
              </Typography>
            </VerticalTimelineElement>

            {/* ~~~~~~~~~~~~~~~~~~~ Q2 2022 ~~~~~~~~~~~~~~~~~~ */}
            <VerticalTimelineElement
              className="vertical-timeline-element-left"
              contentStyle={{ background: props.useDarkTheme ? darkThemePrimary : lightThemePrimary, color: props.useDarkTheme ? '#fff' : '#fff' }}
              contentArrowStyle={{ borderRight: `7px solid ${props.useDarkTheme ? darkThemePrimary : lightThemePrimary}` }}
              date="Q2 2022"
              iconStyle={{ background: props.useDarkTheme ? darkThemePrimary : lightThemePrimary, color: props.useDarkTheme ? '#fff' : '#000' }}
              icon={<ArrowDownwardIcon />}
              
            >
              <Typography variant="p">
                <ArrowForwardIcon /> Purchase First Properties
              </Typography>
              <br/>
              <Typography variant="p">
                <ArrowForwardIcon /> CoinMarketCap and CoinGecko Listings
              </Typography>
              <br/>
              <Typography variant="p">
                <ArrowForwardIcon /> Launch NFT Marketplace
              </Typography>
              <br/>
              <Typography variant="p">
                <ArrowForwardIcon /> Hold 3 More Airdrops
              </Typography>
              <br/>
              <Typography variant="p">
                <ArrowForwardIcon /> Further Expand Marketing Campaigns
              </Typography>
              <br/>
              <Typography variant="p" className={styles.lastTimelineElement}>
                <ArrowForwardIcon /> Reach 2,500 Concurrent Holders
              </Typography>
            </VerticalTimelineElement>

            {/* ~~~~~~~~~~~~~~~~~~~ Q3 2022 ~~~~~~~~~~~~~~~~~~ */}
            <VerticalTimelineElement
              className="vertical-timeline-element-right"
              contentStyle={{ background: props.useDarkTheme ? darkThemePrimary : lightThemePrimary, color: props.useDarkTheme ? '#fff' : '#fff' }}
              contentArrowStyle={{ borderRight: `7px solid ${props.useDarkTheme ? darkThemePrimary : lightThemePrimary}` }}
              date="Q3 2022"
              iconStyle={{ background: props.useDarkTheme ? darkThemePrimary : lightThemePrimary, color: props.useDarkTheme ? '#fff' : '#000' }}
              icon={<ArrowDownwardIcon />}
            >
              <Typography variant="p">
                <ArrowForwardIcon /> Hire Larger Team to Help Manage Real Estate
              </Typography>
              <br/>
              <Typography variant="p">
                <ArrowForwardIcon /> Continue Marketing Outreach
              </Typography>
              <br/>
              <Typography variant="p">
                <ArrowForwardIcon /> Continue Montly Airdrops
              </Typography>
              <br/>
              <Typography variant="p" className={styles.lastTimelineElement}>
                <ArrowForwardIcon /> Reach 5,000 Concurrent Holders
              </Typography>
            </VerticalTimelineElement>

            {/* ~~~~~~~~~~~~~~~~~~~ Q4 2022 ~~~~~~~~~~~~~~~~~~ */}
            <VerticalTimelineElement
              className="vertical-timeline-element-left"
              contentStyle={{ background: props.useDarkTheme ? darkThemePrimary : lightThemePrimary, color: props.useDarkTheme ? '#fff' : '#fff' }}
              contentArrowStyle={{ borderRight: `7px solid ${props.useDarkTheme ? darkThemePrimary : lightThemePrimary}` }}
              date="Q4 2022"
              iconStyle={{ background: props.useDarkTheme ? darkThemePrimary : lightThemePrimary, color: props.useDarkTheme ? '#fff' : '#000' }}
              icon={<ArrowDownwardIcon />}
            >
              <Typography variant="p">
                <ArrowForwardIcon /> Expand to Apartments and Commercial Properties
              </Typography>
              <br/>
              <Typography variant="p">
                <ArrowForwardIcon /> Apply to be Listed on Centralized Exchanges
              </Typography>
              <br/>
              <Typography variant="p" className={styles.lastTimelineElement}>
                <ArrowForwardIcon /> Reach 10,000 Concurrent Holders
              </Typography>
            </VerticalTimelineElement>

            {/* ~~~~~~~~~~~~~~~~~~~ 2023 and Beyond ~~~~~~~~~~~~~~~~~~ */}
            <VerticalTimelineElement
              className="vertical-timeline-element-left"
              contentStyle={{ background: props.useDarkTheme ? darkThemePrimary : lightThemePrimary, color: props.useDarkTheme ? '#fff' : '#fff' }}
              contentArrowStyle={{ borderRight: `7px solid ${props.useDarkTheme ? darkThemePrimary : lightThemePrimary}` }}
              date="2023 and Beyond"
              iconStyle={{ background: props.useDarkTheme ? darkThemePrimary : lightThemePrimary, color: props.useDarkTheme ? '#fff' : '#000' }}
              icon={<ArrowDownwardIcon />}
            >
              <Typography variant="p">
                <ArrowForwardIcon /> Continue to Expand Real Estate Portfolio
              </Typography>
              <br/>
              <Typography variant="p">
                <ArrowForwardIcon /> Grow the Real Estate Management Team
              </Typography>
              <br/>
              <Typography variant="p">
                <ArrowForwardIcon /> More NFTs will be Minted for New Properties
              </Typography>
              <br/>
              <Typography variant="p" className={styles.lastTimelineElement}>
                <ArrowForwardIcon /> And Much More to Come!
              </Typography>
            </VerticalTimelineElement>
            
            <VerticalTimelineElement
              iconStyle={{ background: props.useDarkTheme ? darkThemePrimary : lightThemePrimary, color: props.useDarkTheme ? '#fff' : '#000' }}
              icon={<ArrowDownwardIcon />}
            />
          </VerticalTimeline>
        </Grid>        
    )
}