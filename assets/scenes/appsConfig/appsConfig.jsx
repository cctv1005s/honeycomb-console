'use strict';

var React = require('react');
let connect = require('react-redux').connect;
let classnames = require('classnames');
import { Modal, Button, Table, Icon, Tag, Select, Input, Form, Spin} from 'antd';
const Option = Select.Option;
const FormItem = Form.Item;
const confirm = Modal.confirm;
require('./appsConfig.less');
let jsdiff = require('diff');
let CodeMirror = require('../../coms/commentCM');
let User = require("../../services/user");
require('codemirror/lib/codemirror.css');
require('codemirror/mode/javascript/javascript');
const URL = require("url");
import ConfigDiff from './config-diff';
import jsonParser from 'editor-json-parser';


const COMMENT_FLAG = '_COMMENT_BLOCK_DONT_TOUCH_';
/**
 * 
 * @param {Object} widget 输入的注释框内容
 * @param {Object} code 编辑器中的内容
 */
const mergeCode = (code, comment) => {
  const json = jsonParser.parse(code);
  json[COMMENT_FLAG] = comment;
  return JSON.stringify(json, null, 2);
}

const extracCode = (code) => {
  if(!code){
    return {
      remark: [],
      code: ''
    }
  }

  let json = {};
  try{
    json = jsonParser.parse(code);
  }catch(e){
    console.log(e);
  }

  const comment = json[COMMENT_FLAG];
  delete json[COMMENT_FLAG];
  const showCode = JSON.stringify(json, null, 2);
  return {
    comment,
    code: showCode
  };
}


class AppsConfig extends React.Component {
  state = {
    isEdit: false,
    currentAppConfig:' ',
    currentApp:'',
    newAppConfig:' ',
    comment: {},
    loading: false,
    code: '',
    showDiff: false,
  }
  showEditConfig = () => {
    this.setState({
      isEdit : true
    })
  }
  showDiff = () => {
    this.setState({
      showDiff: true
    });
  }
  hideDiff = () => {
    this.setState({
      showDiff: false,
    });
  }
  closeEditConfig = () => {
    let currentAppConfig = this.state.currentAppConfig
    this.setState({
      isEdit : false,
      newAppConfig:currentAppConfig
    })
  }

  handleAppsConfig = (operation, value) => {
    let clusterCode = URL.parse(window.location.href, true).query.clusterCode;
    let appName = this.state.currentApp;
    let tmp = value.split(':');
    let type = tmp[0];
    let appId = tmp[1];
    let res = null;
    if(operation === 'get'){
      this.setState({
        loading: true,
        configName: value
      });
      this.props.getAppsConfig({clusterCode:clusterCode,type:type},{appId:appId}).then((result)=>{
        try{
          res = JSON.stringify(this.props.appsConfigMeta.meta, null, 2);
          if(res){
            this.setState({loading: false});
          }
        }catch(err){
          console.log(err);
        }

        const {
          code, comment 
        } = extracCode(res);
        this.setState({
          currentAppConfig : code,
          newAppConfig: code,
          currentApp : value,
          comment: comment
        })
      })
    } else if(operation === 'set') {
      let diff = jsdiff.diffLines(this.state.currentAppConfig, this.state.newAppConfig);
      let that = this;
      confirm({
        title: '是否提交以下修改',
        content: (
          <pre>
            {
              diff.map((item, index)=>{
                return(
                  <span key={index} className={item.added ? 'green' : item.removed ? 'red' : 'gray' }>{item.value}</span>
                )
              })
            }
          </pre>
        ),
        iconType: 'question-circle-o',
        width: 600,
        onOk: () => {
          let appConfig = mergeCode(this.state.newAppConfig, this.state.comment);
          this.props.setAppConfig({clusterCode:clusterCode,appConfig:appConfig,type:type},{appId:appId}).then((result)=>{
            this.props.getAppsConfig({clusterCode:clusterCode,type: type},{appId: appId}).then((result)=>{
              this.setState({loading: true})
              try{
                res = JSON.stringify(this.props.appsConfigMeta.meta, null, 2);
                if(res){
                  this.setState({loading: false});
                }
              }catch(err){
                console.log(err);
              }
              const {
                code, comment 
              } = extracCode(res);              
              this.setState({
                currentAppConfig : code,
                newAppConfig: code,
                comment: comment,
                isEdit : false,
              })
            })
          }).catch((err) => {
            console.log(err);
            this.closeEditConfig();
          });
        },
        onCancel() {},
      });
    }
  }

  changeAppsConfig = (e) => {
    this.setState({
      newAppConfig: e
    })
  }

  commentChange = (comment) => {
    this.setState({
      comment
    });
  }

  render() {
    if(this.state.showDiff){
      return <ConfigDiff onFinish={this.hideDiff}/>
    }

    let membersList = [];
    let appList = _.filter(this.props.appMeta.appList,(value,key)=>{
      return value.name.indexOf("__ADMIN__") < 0 && value.name.indexOf("__PROXY__")
    })
    membersList = _.map(appList,(value, key) => {
      return <Option key={value.name} value={"app:" + value.name}> {value.name} </Option>;
    });
    const formItemLayout = {
      wrapperCol: { span: 25 },
    };

    return(
      <div className="appsconfig-wrap">
        <div className="appsconfig-select">
          <span><h3>请选择app:</h3></span>
          <Select defaultValue="请选择app" size="large" style={{ width: 200 }}
            getPopupContainer={() => document.getElementsByClassName('appsconfig-wrap')[0]}
            onChange={this.handleAppsConfig.bind(this,"get")}
          >
            {membersList}
            <Option value="" disabled>————————</Option>
            <Option value="server:common"> common </Option>
            <Option value="server:server"> server </Option>
          </Select>
        </div>
        <div className="appsconfig-textarea">
          <span className="appsconfig-text-title"><h3>配置信息：</h3></span>
          {
            this.state.isEdit ?
            (
              <div className="appsconfig-text">
                <Spin tip="Loading..." spinning={this.state.loading}>
                  <CodeMirror 
                    key={this.state.currentAppConfig} 
                    onChange={this.changeAppsConfig}
                    options={{lineNumbers:true,mode:'javascript'}}
                    comment={this.state.comment}
                    onCommentChange={this.commentChange}
                    value={this.state.newAppConfig + 'show'}
                  />
                </Spin>
                <div>
                  <Button onClick={this.handleAppsConfig.bind(this,"set", this.state.configName)} type="primary">提交</Button>
                  <Button onClick={this.closeEditConfig}>取消</Button>
                </div>
              </div>
            ) : 
            (
              <div className="appsconfig-pre">
                <Spin tip="Loading..." spinning={this.state.loading}>
                  <CodeMirror 
                    value={this.state.newAppConfig + 'edit'}
                    options={{lineNumbers:true,mode:'javascript', readOnly: true, cursorHeight: 0 }}
                    comment={this.state.comment}
                    value={this.state.newAppConfig}
                  />
                </Spin>
                <div>
                  <Button type="primary" onClick={this.showEditConfig}>编辑配置</Button>
                  &nbsp;&nbsp;
                  <Button type="primary" onClick={this.showDiff}>配置对比</Button>
                </div>
              </div>
            )
          }
        </div>
      </div>
    )
  }
}

let mapStateToProps = (store) => {
  let appMeta = store.app;
  let appsConfigMeta = store.appsConfig;
  return {
    appMeta,
    appsConfigMeta
  }
}

let actions = require("../../actions");

module.exports = connect(mapStateToProps,{
  getAppsConfig : actions.appsConfig.getAppsConfig,
  setAppConfig : actions.appsConfig.setAppConfig,
})(AppsConfig);
