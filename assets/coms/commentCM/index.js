import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import CodeMirror from 'react-codemirror';
import 'codemirror/addon/display/panel.js'
import _ from 'lodash';
import Remark from './remark';
import Panel from './panel';

  /**
   * interface LineWidget{
   *  clear: function():void; // remove lineWidget
   * }
   * 
   * interface Widget{
   *  [lineNumber: string] : {
   *   comment: string;
   *   instance: LineWidget;
   *  }
   * }
   * 
   * interface Comment{
   *  [lineNumber: string] : {
   *   comment: string;
   *  } 
   * }
   */

/**
 * widget -> comment
 * @param {Object} widget Widget
 * @return 
 */
const getComment = (widget, editor) => {
  const comment = {};
  Object.keys(widget).forEach(key => {
    // 过滤空字符串
    const _comment = _.get(widget, `[${key}].comment`, '');
    if(!_comment.trim()){
      return;
    }
    let lineNumber = editor.getLineNumber(widget[key].instance.line);
    if(!lineNumber){
      return;
    }
    comment[lineNumber] = {
      comment: widget[key].comment,
      indent: widget[key].indent || 0,
      color: widget[key].color || '#aaa',
    };
  })
  return comment;
}

/**
 * 统计一个字符串开头有几个空格
 * @param {String} str 字符串
 */
const whitespace = (str) => {
  if(!str){
    return ;
  }
  const as = str.split('');
  let count = 0;
  for(let i of as){
    if(i !== ' '){
      return count;
    }
    count ++;
  }
  return count;
}

class CommentCodeMirror extends React.Component{
  static PropTypes = {
    onChange: PropTypes.func,
    onCommentChange: PropTypes.func,
    value: PropTypes.string,
    options: PropTypes.object, // CodeMirror的options
    comment: PropTypes.object,
  }

  static defaultProps = {
    onCommentChange: () => null
  }

  // Widget
  widget = {};

  /**
   * 增加某一行的注释
   * @param {Number} line 当前行号
   * @return {Function} 监听函数
   */
  addLineComment = (line) => {
    return (value, indent, color) => {
      if(this.widget[line]){
        this.widget[line].comment = value;
        this.widget[line].indent = indent;
        this.widget[line].color = color;
        const comment = getComment(this.widget, this.editor);
        this.props.onCommentChange(comment);
      }
    }
  }

  /**
   * 删除某一行的注释
   * 1, 删除widget
   * 2, 删除widget content 中的注释
   */
  deleteLineComment = (line) => {
    return () => {
      if(this.widget[line]){
        this.widget[line].instance.clear();
        delete this.widget[line];
        const comment = getComment(this.widget, this.editor);
        this.props.onCommentChange(comment);
      }
    }
  }

  handleInsert = () => {
    const widget = this.widget;
    const { line } = this.editor.getCursor();
    const lineHandle = this.editor.getLineHandle(line);
    const text = lineHandle.text;
    // 计算当前空格的数量
    if(widget[line]){
      return ;
    }
    this.renderComment(line, undefined, undefined, whitespace(text));
  }

  /**
   * 往第x行插入注释
   * @param {Number} line 编辑器行数
   * @param {String} value 插入注释
   * @param {String} indent 缩进 (indent * 10)px
   * @param {String} color 备注颜色, hex
   */
  renderComment = (line, value, mode = 'edit', indent = 0, color = '#aaa') => {
    if(!Number(line)){
      return;
    }
    // 插入 widget
    const remark = document.createElement('div');
    ReactDOM.render(
      <Remark 
        onChange={this.addLineComment(line)}
        onDelete={this.deleteLineComment(line)}
        mode={mode}
        value={value}
        indent={indent}
        color={color}
        readOnly={_.get(this, 'props.options.readOnly')}
      />,
      remark
    );
    const instance = this.editor.addLineWidget(Number(line), remark);
    this.widget[line] = {};
    this.widget[line].instance = instance;
    if(value){
      this.widget[line].comment = value;
      this.widget[line].indent = indent;
      this.widget[line].color = color;
    }
  }

  componentDidMount(){
    this.editor.setOption('extraKeys', {
      'Cmd-Enter': this.handleInsert,
      'Ctrl-Enter': this.handleInsert
    });
    this.editor.setValue(this.props.value);
    this.initComment();
    this.editor.on('change', this.changeComment);
    if(!_.get(this, 'props.options.readOnly')){
      this.initPanel();
    }
  }

  changeComment = () => {
    const comment = getComment(this.widget, this.editor);
    this.props.onCommentChange(comment);    
  }

  // 初始化所有的comment
  initComment = (comment = this.props.comment) => {
    if(comment){
      Object.keys(comment).forEach(line => {
        if(!_.get(this, `widget[${line}].instance`)){
          const {
            comment: _comment, indent, color
          } = comment[line];
          this.renderComment(line, _comment, 'show', indent, color);
        }
      });
    }
  }

  // 初始化顶部Penel
  initPanel = () => {
    const panel = document.createElement('div');
    ReactDOM.render(
      <Panel 
        onClick={this.handleInsert}
      />,
      panel
    );
    this.panel = this.editor.addPanel(panel, {position: 'top', stable: true});
  }

  componentWillUnmount(){
    if(this.panel){
      this.panel.clear();
    }
  }

  render(){
    return (
      <CodeMirror
        value={this.props.value}
        onChange={this.props.onChange}
        options={{
          ...this.props.options,
          height: 20,
        }}
        ref={(c) => {
          if(!this.editor){
            this.editor = c.getCodeMirror();
          }
        }}
      />
    )
  }
}

export default CommentCodeMirror;