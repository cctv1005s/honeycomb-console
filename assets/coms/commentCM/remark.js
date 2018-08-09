import React from 'react';
import PropTypes from 'prop-types';
import { Icon, Tooltip, Modal } from 'antd';
import { BlockPicker } from 'react-color'
import './remark.less';

// 用于显示注释的组件
class Remark extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    onDelete: PropTypes.func,
    value: PropTypes.string,
    mode: PropTypes.string, // enum ['show', 'edit']
    readOnly: PropTypes.bool, // 是否点击可编辑
    indent: PropTypes.number,
    color: PropTypes.string, // 注释的颜色
  }

  static defaultProps = {
    onDelete: () => null,
    onChange: () => null,
    mode: 'edit'
  }

  /**
   * 状态:
   *  readonly -> editable
   * 时间:
   *  onChange 编辑结束时调用 editable -> readonly
   *  onDelete 点击删除时调用
   *  value 默认值
   */
  state = {
    mode: this.props.mode || 'edit', // enum['edit', 'show'] 当前状态
    value: this.props.value,
    indent: this.props.indent || 0,
    color: this.props.color || '#aaa',
    showPicker: false,
  }

  // 只渲染内容
  renderShow = () => {
    const {
      value,
      indent,
      color
    } = this.state;
    return (
      <div style={{ paddingLeft: (indent || 0) * 10 }}>
        <span className="remark-show" onClick={this.changeMode('edit')}>
          <span>
            <Icon type="enter" className="icon-up"/>
          </span>
          <span style={{ color: color }}>
          {
            this.state.value
          }
          {
            Boolean(value) || "点击我输入内容"
          }
          </span>
        </span>
      </div>
    );
  }

  handleChange = (e) => {
    this.setState({
      value: e.target.value
    });
  }

  // 渲染编辑框
  renderEdit = () => {
    const {
      indent, color
    } = this.state;
    return (
      <div className="remark-edit" style={{ marginLeft: (indent || 0) * 10 }}>
        <div className="remark-tool-box">
          <div onClick={this.action('finish')}>
            <Tooltip placement="top" title={"完成"}>
              <Icon type="rollback" className="icon-right"/>
            </Tooltip>
          </div>
          <div onClick={this.action('delete')}>
            <Tooltip placement="top" title={"删除"}>
              <Icon type="delete" />
            </Tooltip>
          </div>
          <div onClick={this.action('right')}>
            <Tooltip placement="top" title={"后退一格"}>
              <Icon type="arrow-right" />
            </Tooltip>
          </div>
          <div onClick={this.action('left')}>
            <Tooltip placement="top" title={"前进一格"}>
              <Icon type="arrow-left" />
            </Tooltip>
          </div>
          <div onClick={this.action('color')}>
            <Tooltip placement="top" title={"颜色"}>
              <Icon type="api" style={{ color: color }}/>
            </Tooltip>
          </div>          
        </div>
        <div className="remark-input-box">
          <input 
            className="remark-input" 
            value={this.state.value} 
            onChange={this.handleChange}
            placeholder="请输入注释"
            style={{ color: color }}
            onKeyDown={(e) => {
              if(e.key === 'Enter'){
                this.action('finish')();
              }
            }}
            autoFocus
          />
        </div>
      </div>
    );
  }

  /**
   * @param {String} mode 选择模式 
   */
  changeMode = (mode) => {
    return () => {
      if(!this.props.readOnly){
        this.setState({
          mode,
          showPicker: false,
        });
      }
    }
  }

  /**
   * 处理点击事件
   * @param {String} type enum{"delete", "finish"}
   */
  action = (type) => {
    return () => {
      if(type === 'delete'){
        Modal.warning({
          title: '警告',
          content: '确定删除?删除将不可恢复!',
          onOk: () => {
            this.props.onDelete();
          }
        });
      }

      // 完成注释
      if(type === 'finish'){
        this.changeMode('show')();
        this.props.onChange(this.state.value, this.state.indent, this.state.color );
      }

      // 调整注释位置
      const indent = this.state.indent;
      if(type === 'right' || type === 'left'){
        const map = {
          right: 1,
          left: -1
        };
        this.setState({
          indent: indent + map[type]
        }, () => {
          this.props.onChange(this.state.value, this.state.indent);
        });
      }

      // 点击color按钮,显示取色板
      if(type === 'color'){
        this.setState({
          showPicker: !this.state.showPicker,
        });
      }
    }
  }

  /**
   * 取色板颜色变化
   * @param {String} color 颜色, hex
   */
  colorChange = ({hex}) => {
    this.setState({
      color: hex
    });
  }

  render() {
    const maps = {
      edit: this.renderEdit,
      show: this.renderShow
    };
    const { 
      mode, indent, showPicker, color
    } = this.state;
    return (
      <div className="remark" style={{ position: 'relative' }}>
        {
          maps[mode]()
        }
        {
          showPicker && (
            <div style={{ position: 'absolute', left: 50 + Number(indent) * 10, top: 40, zIndex: 4 }}>
              <BlockPicker
                color={color}
                onChangeComplete={this.colorChange}
              />
            </div>
          )
        }
      </div>
    );
  }
}

export default Remark;
