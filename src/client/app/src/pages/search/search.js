import React from "react";
import styled from "styled-components";
import { FilterBar } from "./FilterBar.js";
import { Card, Tooltip } from "@material-ui/core";
import PerfectScrollbar from "react-perfect-scrollbar";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  blue,
  orange,
  red,
  green,
  grey,
  purple
} from "@material-ui/core/colors";
import { MainContext } from "../../App.js";

const ColoredIcon = styled(FontAwesomeIcon)`
  cursor: 'pointer',
  color: ${props => props.color},
`;
const Stats = styled.div`
  padding-right: 8px;
  display: inline-block;
  font-size: 12px;
`;
const Metric = styled.div`
  color: ${red[500]}
  padding-left: 5px;
  display: inline-block;
`;
const RightStats = styled.div`
  float: right;
  font-size: 12px;
  padding-left: 8px;
`;
const Title = styled.div`
  padding-bottom: 5px;
  font-size: 16px;
`;
const SubTitle = styled.div`
  padding-bottom: 5px;
  color: #666;
  font-size: 12px;
  line-height: 1.5em;
  height: 3em;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 475px;
`;
const SearchPanel = styled.div`
  overflow: none;
`;
const Scrollbar = styled(PerfectScrollbar)`
  overflow-x: hidden;
  position: relative;
  height: calc(100vh - 115px);

  .ps {
    overflow: hidden;
    touch-action: auto;
  }

  .ps__rail-x,
  .ps__rail-y {
    display: none;
    opacity: 0;
    transition: background-color 0.2s linear, opacity 0.2s linear;
    height: 15px;
    bottom: 0px;
    position: absolute;
  }
`;
const ResultCard = styled(Card)({
  borderRight: "1px solid rgba(0, 0, 0, 0.12)",
  borderRadius: 0,
  padding: 10,
  paddingLeft: 15,
  paddingTop: 15,
  paddingBottom: 15,
  cursor: "pointer",
  maxWidth: 600
});
const dataStatus = {
  active: {
    title: "verified",
    icon: "check",
    color: green[500]
  },
  deactivated: {
    title: "deactivated",
    icon: "times",
    color: red[500]
  },
  in_preparation: {
    title: "unverified",
    icon: "wrench",
    color: orange[500]
  }
};
TimeAgo.addLocale(en);
const timeAgo = new TimeAgo("en-US");

class SearchElement extends React.Component {
  render() {
    const abbreviateNumber = value => {
      let newValue = value;
      if (value > 1000) {
        const suffixes = ["", "k", "M", "B", "T"];
        let suffixNum = 0;
        while (newValue >= 1000) {
          newValue /= 1000;
          suffixNum++;
        }
        newValue = newValue.toPrecision(3);
        newValue += suffixes[suffixNum];
      }
      return newValue;
    };
    const scores = [];
    if (this.props.stats2 !== undefined && this.props.type === "run") {
      if (this.props.stats2[0].value) {
        scores.push(
          <Tooltip title="Accuracy" placement="top-start" key="ACC">
            <Stats>
              <Metric>ACC</Metric> {this.props.stats2[0].value}
            </Stats>
          </Tooltip>
        );
      }
      if (this.props.stats2[1].value) {
        scores.push(
          <Tooltip title="Area under ROC curve" placement="top-start" key="ROC">
            <Stats>
              <Metric>AUC</Metric> {this.props.stats2[1].value}
            </Stats>
          </Tooltip>
        );
      }
      if (this.props.stats2[2].value) {
        scores.push(
          <Tooltip
            title="Root Mean Squared Error"
            placement="top-start"
            key="RMSE"
          >
            <Stats>
              <Metric>RMSE</Metric> {this.props.stats2[2].value}
            </Stats>
          </Tooltip>
        );
      }
    }

    return (
      <ResultCard onClick={this.props.onclick}>
        <Title>{this.props.name}</Title>
        <SubTitle>{this.props.teaser}</SubTitle>
        {this.props.stats !== undefined && this.props.type !== "run" && (
          <React.Fragment>
            <Tooltip title="runs" placement="top-start">
              <Stats>
                <ColoredIcon color={red[500]} icon="atom" fixedWidth />{" "}
                {abbreviateNumber(this.props.stats[0].value)}
              </Stats>
            </Tooltip>
            <Tooltip title="likes" placement="top-start">
              <Stats>
                <ColoredIcon color={purple[500]} icon="heart" fixedWidth />{" "}
                {abbreviateNumber(this.props.stats[1].value)}
              </Stats>
            </Tooltip>
            <Tooltip title="downloads" placement="top-start">
              <Stats>
                <ColoredIcon
                  color={blue[700]}
                  icon="cloud-download-alt"
                  fixedWidth
                />{" "}
                {abbreviateNumber(this.props.stats[2].value)}
              </Stats>
            </Tooltip>
          </React.Fragment>
        )}
        {this.props.stats2 !== undefined && this.props.type === "data" && (
          <Tooltip title="dimensions (rows x columns)" placement="top-start">
            <Stats>
              <ColoredIcon color={grey[400]} icon="table" fixedWidth />{" "}
              {abbreviateNumber(this.props.stats2[0].value)} x{" "}
              {abbreviateNumber(this.props.stats2[1].value)}
            </Stats>
          </Tooltip>
        )}
        {this.props.stats2 !== undefined && this.props.type === "run" && scores}
        {dataStatus[this.props.data_status] !== undefined && (
          <Tooltip
            title={dataStatus[this.props.data_status]["title"]}
            placement="top-start"
          >
            <RightStats>
              <ColoredIcon
                color={dataStatus[this.props.data_status]["color"]}
                icon={dataStatus[this.props.data_status]["icon"]}
                fixedWidth
              />
            </RightStats>
          </Tooltip>
        )}
        <RightStats style={{ color: grey[400] }}>
          <ColoredIcon color={grey[400]} icon="history" fixedWidth />
          {timeAgo.format(new Date(this.props.date))}
        </RightStats>
      </ResultCard>
    );
  }
}

export class SearchResultsPanel extends React.Component {
  static contextType = MainContext;

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  getTeaser = description => {
    if (description === undefined || description === null) {
      return undefined;
    }
    let lines = description.split("\n").map(i => i.trim());
    for (let i = 0; i < lines.length; i++) {
      if (
        !lines[i].startsWith("*") &&
        !lines[i].startsWith("#") &&
        lines[i].length > 0
      ) {
        return lines[i];
      }
    }
    return lines[0];
  };

  getStats = (stats, result) => {
    if (stats === undefined) {
      return undefined;
    } else {
      return stats.map(stat => ({
        value: result[stat.param],
        unit: stat.unit,
        icon: stat.icon
      }));
    }
  };

  render() {
    let component = null;
    if (
      this.context.results.length >= 1 &&
      this.context.results[0][
        (this.context.type === "task_type" ? "tt" : this.context.type) + "_id"
      ] !== undefined
    ) {
      let key =
        this.context.type === "measure"
          ? "name"
          : (this.context.type === "task_type" ? "tt" : this.context.type) +
            "_id";

      component = this.context.results.map(result => (
        <SearchElement
          name={result.name ? result.name : result.comp_name}
          teaser={this.getTeaser(result.description)}
          stats={this.getStats(this.props.stats, result)}
          stats2={this.getStats(this.props.stats2, result)}
          id={result[this.context.type + "_id"]}
          onclick={() =>
            this.props.selectEntity(result[this.context.type + "_id"] + "")
          }
          key={result[key]}
          type={this.props.type}
          data_status={result.status}
          date={result.date}
        ></SearchElement>
      ));
    } else if (this.context.error !== null) {
      component = (
        <p style={{ paddingLeft: 10 }}>Error: {this.context.error}</p>
      );
    } else if (this.context.updateType === "query") {
      component = <p style={{ paddingLeft: 10 }}>Loading...</p>;
    } else {
      component = <p style={{ paddingLeft: 10 }}>No search results found</p>;
    }

    if (this.props.tag === undefined) {
      return (
        <React.Fragment>
          <SearchPanel>
            <FilterBar
              sortOptions={this.props.sortOptions}
              filterOptions={this.props.filterOptions}
              searchColor={this.props.searchColor}
              resultSize={this.context.counts}
              resultType={this.props.type}
              sortChange={this.props.sortChange}
              filterChange={this.props.filterChange}
              selectEntity={this.props.selectEntity}
            />
            <Scrollbar
              style={{
                display: this.context.displaySearch ? "block" : "none"
              }}
            >
              {component}
            </Scrollbar>
          </SearchPanel>
        </React.Fragment>
      );
    } else {
      //nested query
      return (
        <React.Fragment>
          <SearchPanel>{component}</SearchPanel>
        </React.Fragment>
      );
    }
  }
}
