'use strict';

var React = require('react');
let connect = require('react-redux').connect;
let classnames = require('classnames');
let AddClusterModal = require('./add-cluster-modal.jsx');
let EditClusterModal = require('./edit-cluster-modal.jsx');
let UpdateSafeTokenModal = require('./update-safeToken-modal');
const _ = require('lodash');
const randomstring = require("randomstring");
import { Modal, Button, Table, Icon, Tag } from 'antd';
const confirm = Modal.confirm;
const ORIGIN_TOKEN = '***honeycomb-default-token***';
require('./clusterMgr.less');

let UserService = require('../../services/user');
class Cluster extends React.Component {
  state = {
    addClusterModalState: {
      isShow: false,
      info: {}
    },
    editClusterModalState: {
      isShow: false,
      info: {}
    },
    updateSafeTokenModalState: {
      isShow: false,
      info: {}
    }
  }
  clusterModal = (operation,state,data=this.state.editClusterModalState.info) => {
    switch(operation){
      case 'add':
        this.setState({
          addClusterModalState:{
            isShow:state
          },
        });
        break;
      case 'edit':
        this.setState({
          editClusterModalState:{
            isShow:state,
            info:data,
          },
        });
        break;
      case 'updateToken':
        let self = this;
        confirm({
          title: '安全修复',
          content: '检测到该集群正在使用默认的token，这可能会造成安全隐患，是否自动修复?',
          onOk() {
            self.changeUnSafeToken(data);
          },
          onCancel() {},
        });
    }

  }
  changeUnSafeToken = (data) => {
    let newToken = randomstring.generate(64);
    // call api change server config.admin.token
    let info = _.cloneDeep(data);
    this.props.getAppsConfig({clusterCode:info.code},{appId:'server',type:'server'}).then(({config})=>{
      // call api change cluster config
      config = _.merge(config,{admin:{token:newToken}});
      return this.props.setAppConfig({clusterCode:info.code,appConfig:JSON.stringify(config),type:'server'},{appId:'server'});
    }).then(()=>{
      info = _.assign({},info,{isUpdate:true,token:newToken});
      this.props.addCluster(info);
    }).catch((err)=>{
      console.error(err);
    });
  }
  showConfirm = (record) => {
    let that = this;
    confirm({
      title: '确定要删除该集群吗？',
      content: '无法复原，请谨慎操作',
      onOk() {
        that.props.deleteCluster({},{code:record.code}).then(()=>{
          that.props.getCluster();
        })
      },
      onCancel() {},
    });
  }
  generateColumns = () => {
    this.columns = [{
      title: 'name',
      key:'name',
      render:(text,record,index)=>{
        return(
          <div key={index}>
            {record.name}
            {record.token === ORIGIN_TOKEN &&
              (<a onClick={this.clusterModal.bind(this,"updateToken",true,record)}>
                <Icon type="exclamation-circle" style={{ marginLeft: 8,fontSize: 16, color: 'red' }} />
               </a>
              )}
          </div>
        )
      }
    },{
      title:'code',
      key:'code',
      dataIndex:'code'
    },{
      title:'endPoint',
      key:'endPoint',
      dataIndex:'endpoint'
    },{
      title:'token',
      render:(text,record,index)=>{
        return(
          <div key={index}><span>***</span></div>
        )
      }
    },{
      title:'ipList',
      className: 'ip-list',
      render:(text,record,index)=>{
        return(
          <div key={index}>
            {record.ips.map((value,key)=>{
              return(
                <p key={key}>{value}</p>
              )
            })}
          </div>
        )
      }
    },{
      title:'actions',
      key:'actions',
      render:(text,record,index)=>{
        return (
          <div key={index}>
            <Button onClick={this.clusterModal.bind(this,"edit",true,record)}>编辑</Button>
            <Button type="danger" onClick={this.showConfirm.bind(this,record)}>删除</Button>
          </div>
        )
      }
    }]
  }
   render() {
    this.generateColumns();
    let dataSource = _.map(this.props.clusterMeta.meta,function(value,key){
      if(value.token === ORIGIN_TOKEN){
        window.dispatchEvent(new Event('warning'));
      }
      return  _.assign({},value,{code:key},{key:key});
    });
    let user = UserService.getUserSync();
    return(
      <div className="cluster-wrap">
        <div className="addbtn-wrap">
          <Button type="primary" onClick={this.clusterModal.bind(this,"add",true)}>新增集群</Button>
        </div>
        <div className="cluster-table-warp">
          <Table
            columns={this.columns}
            dataSource={dataSource}
            pagination={false}
          />
        </div>
        <AddClusterModal
          getCluster={this.props.getCluster}
          addCluster={this.props.addCluster}
          visible={this.state.addClusterModalState.isShow}
          onHide={this.clusterModal.bind(this,"add",false)}
        />
        <EditClusterModal
          info={this.state.editClusterModalState.info}
          getCluster={this.props.getCluster}
          addCluster={this.props.addCluster}
          visible={this.state.editClusterModalState.isShow}
          onHide={this.clusterModal.bind(this,"edit",false)}
        />
        <UpdateSafeTokenModal
          info={this.state.updateSafeTokenModalState.info}
          visible={this.state.updateSafeTokenModalState.isShow}
          onHide={this.clusterModal.bind(this,"updateToken",false)}
        />
      </div>
    )
  }
}


let mapStateToProps = (store) => {
  let clusterMeta = store.cluster;
  return {
    clusterMeta
  }
}

let actions = require("../../actions");

module.exports = connect(mapStateToProps,{
  deleteCluster:actions.cluster.deleteCluster,
  getCluster:actions.cluster.getCluster,
  addCluster:actions.cluster.addCluster,
  getAppsConfig:actions.appsConfig.getAppsConfig,
  setAppConfig:actions.appsConfig.setAppConfig,
})(Cluster);
