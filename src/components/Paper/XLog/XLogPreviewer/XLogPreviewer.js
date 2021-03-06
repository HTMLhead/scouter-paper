import React, {Component} from 'react';
import './XLogPreviewer.css';
import * as d3 from "d3";
import ServerDate from "../../../../common/ServerDate";

class XLogPreviewer extends Component {
    secondStepTimestamp = null;

    graph = {
        height: null
    };

    constructor(props) {
        super(props);

        this.state = {
            xlogs: []
        };
    }

    componentWillReceiveProps(nextProps) {
        if (this.secondStepTimestamp !== nextProps.secondStepTimestamp) {
            let oldXlog = this.state.xlogs;
            let newXlog = nextProps.secondStepXlogs;
            newXlog.forEach((d) => {
                d._done = false;
            });

            let totalXLog = oldXlog.concat(newXlog);
            for (let i = 0; i < totalXLog.length; ++i) {
                for (let j = i + 1; j < totalXLog.length; ++j) {
                    if (totalXLog[i].txid === totalXLog[j].txid) {
                        totalXLog.splice(j--, 1);
                    }
                }

                // 처리가 다 되고, 오래된것은 삭제 필요
            }

            this.setState({
                xlogs: totalXLog
            });
        }

        if (this.props.maxElapsed !== nextProps.maxElapsed) {
            this.graph.y = d3.scaleLinear().range([this.graph.height, 0]).domain([0, nextProps.maxElapsed]);
        }
    }

    componentDidMount() {
        this.graph.height = this.refs.xlogMover.offsetHeight;
        this.graph.y = d3.scaleLinear().range([this.graph.height, 0]).domain([0, this.props.maxElapsed]);
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (this.secondStepTimestamp !== nextProps.secondStepTimestamp) {
            this.secondStepTimestamp = nextProps.secondStepTimestamp;
            return true;
        } else {
            return false;
        }
    }


    componentDidUpdate(prevProps, prevState) {

        if (this.graph.height !== (this.refs.xlogMover.offsetHeight)) {
            this.graph.height = this.refs.xlogMover.offsetHeight;
            this.graph.y = d3.scaleLinear().range([this.graph.height, 0]).domain([0, this.props.maxElapsed]);
        }

        let interval = 5000;
        let now = (new ServerDate()).getTime();
        let divs = this.refs.xlogMover.querySelectorAll("div");
        divs.forEach((div) => {
            let endTime = div.getAttribute("data-end-time");
            if (now - endTime > interval * 3) {
                div.remove();
            }
        });

        let base = this.refs.xlogMover;
        let xlogs = this.state.xlogs;
        xlogs.forEach((xlog) => {
            if (!xlog._done) {
                let exist = base.querySelector("[data-txid='" + xlog.txid + "']");
                if (!exist) {
                    let div = document.createElement("div");
                    let now = (new ServerDate()).getTime();
                    let delay = 2000 - ((now - xlog.endTime));
                    if (delay < 0) {
                        delay = 100;
                    }

                    div.setAttribute("data-txid", xlog.txid);
                    div.setAttribute("data-end-time", xlog.endTime);

                    if (xlog.error !== "0") {
                        div.classList.add("has-error");
                    }

                    div.style.right = "-3px";
                    div.style.bottom = "0";
                    div.style.transitionDelay = (delay) + "ms";
                    div.style.transitionDuration = "5s";
                    div.style.transitionProperty = "all";
                    div.style.transitionTimingFunction = "ease-in-out";

                    base.appendChild(div);
                    setTimeout(() => {
                        div.style.right = "calc(100% + 5px)";
                        let y = null;
                        if (xlog.elapsed >= this.props.maxElapsed) {
                            y = this.graph.y(this.props.maxElapsed);
                        } else {
                            y = this.graph.y(xlog.elapsed);
                        }

                        div.style.bottom = (this.graph.height - y) + "px";
                    }, 10);
                }

                xlog._done = true;
            }
        });

        this.setState({
            xlogs: xlogs
        });
    }

    render() {
        return (
            <div className="xlog-preview" ref="xlogMover"
                 style={{width: this.props.width, top: this.props.margin.top, bottom: this.props.margin.bottom}}></div>
        );
    }
}


export default XLogPreviewer;
