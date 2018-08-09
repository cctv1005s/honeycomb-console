/**
 * @author cctv1005s
 * @description 用于画出侧边栏的笔的一个svg
 * @date 2018-08-08 20:33:34
 * @email cctv1005s@gmail.com
 */
import React from 'react';
import {Icon} from 'antd';
import PropTypes from 'prop-types';
import './panel.less';

function Pen({
  className = '',
  onClick = () => null,
  ...props
}) {
  return (
    <div
    {
      // props转发
      ...props
    }
    className={ 'panel ' + className }
  >
    <span className="add" onClick={onClick}><Icon type="plus" />&nbsp;添加注释</span>
  </div>
  );
}

Pen.propTypes = {
  onClick: PropTypes.func,
  className: PropTypes.string
};

export default Pen;
