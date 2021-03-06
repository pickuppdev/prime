import { PrimeFieldProps } from '@primecms/field';
import { Button, Card, Form, Icon } from 'antd';
import { get } from 'lodash';
import React from 'react';

const randomByte = () => {
  const seq = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16);
  return seq.substr(seq.length - 1, 1);
};
const randomBytes = length =>
  Array.from({ length })
    .map(randomByte)
    .join('');
const randomUuid = () => [8, 4, 4, 4, 12].map(randomBytes).join('-');

const { uuid = { v4: randomUuid } } = window as any;

const initialToken = uuid.v4();

const getItems = ({ initialValue, field }: PrimeFieldProps) => {
  const options = { ...field.defaultOptions, ...field.options };
  if (!options.repeated) {
    // [token, index, expand status]
    return [[initialToken, 0, true]];
  }

  if (Array.isArray(initialValue)) {
    // [token, index, expand status]
    return initialValue.map((_, index) => [uuid.v4(), index, true]);
  }

  return [];
};

const getIndex = (props: PrimeFieldProps) => {
  return Math.max(-1, ...getItems(props).map(n => n[1])) + 1;
};

export class InputComponent extends React.PureComponent<PrimeFieldProps, any> {
  public state = {
    items: getItems(this.props),
    index: getIndex(this.props),
  };

  get options() {
    const { field } = this.props;
    return { ...field.defaultOptions, ...field.options };
  }

  public componentWillReceiveProps(nextProps: PrimeFieldProps) {
    if ((!this.props.document && nextProps.document) ||
      this.props.initialValue !== nextProps.initialValue) {
      this.setState({
        items: getItems(nextProps),
        index: getIndex(nextProps),
      });
    } else if (this.props.document && nextProps.document) {
      if (this.props.document.id !== nextProps.document.id) {
        this.setState({
          items: this.state.items.map((item, index) => {
            return [item[0], index];
          }),
          index: this.state.items.length + 1,
        });
      }
    }
  }

  public onRemoveClick = (e: React.MouseEvent<HTMLElement>) => {
    const key = String(e.currentTarget.dataset.key);
    this.remove(key);
  };

  public onMoveUpClick = (e: React.MouseEvent<HTMLElement>) => {
    const index = Number(e.currentTarget.dataset.index);
    const items = this.state.items.slice(0);

    if (index <= 0) return

    const tmp = items[index - 1];
    items[index - 1] = items[index];
    items[index] = tmp;

    this.setState({ items });
  };

  public onMoveDownClick = (e: React.MouseEvent<HTMLElement>) => {
    const index = Number(e.currentTarget.dataset.index);
    const items = this.state.items.slice(0);

    if (items.length - 1 <= index) return

    const tmp = items[index + 1];
    items[index + 1] = items[index];
    items[index] = tmp;

    this.setState({ items });
  };

  public remove = (k: any) => {
    const items = this.state.items.slice(0);
    items.splice(items.findIndex(n => n[0] === k), 1);
    this.setState({ items });
  };

  public add = () => {
    const { items, index } = this.state;
    this.setState({
      items: [...items, [uuid.v4(), index, true]],
      index: index + 1,
    });
  };

  public toggleExpand = (e: React.MouseEvent<HTMLElement>) => {
    const index = Number(e.currentTarget.dataset.index);
    const items = this.state.items.slice(0);
    items[index][2] = !items[index][2];
    this.setState({ items })
  };

  public renderField = (field: any, key: string, index: number) => {
    const repeated = this.options.repeated;
    const prefix = repeated ? `${index}.` : '';
    const path = `${this.props.path}.${prefix}${field.name}`;
    const initialValue = get(this.props.initialValue, `${prefix}${field.name}`);

    return this.props.renderField({
      ...this.props,
      field,
      path,
      initialValue,
    });
  };

  public renderGroupItem = ([key, index]: any, position) => {
    const { field, form, path } = this.props;
    const { fields = [] } = field;
    const repeated = this.options.repeated;

    if (!key) {
      return null;
    }

    return (
      <Card key={key} className="prime-group-item">
        {repeated && (
          <div className="prime-slice-item-header">
            <div className="ant-form-item-label" />
            <div>
              <Icon
                className={`prime-slice-item-button ${position === 0 ? 'disabled' : ''}`}
                type="up"
                data-index={position}
                onClick={this.onMoveUpClick}
              />
              <Icon
                className={`prime-slice-item-button ${
                  position === this.state.items.length - 1 ? 'disabled' : ''
                }`}
                type="down"
                data-index={position}
                onClick={this.onMoveDownClick}
              />
            </div>
            <div className="prime-slice-item-actions">
              <Icon
                className="prime-slice-item-button"
                type={!this.state.items[position]![2] ? 'caret-right' : 'caret-down'}
                data-index={position}
                onClick={this.toggleExpand}
              />
              <Icon
                className="prime-slice-item-button"
                type="close"
                data-key={key}
                onClick={this.onRemoveClick}
              />
            </div>
          </div>
        )}
        {form.getFieldDecorator(`${path}.${position}.__index`, {
          initialValue: index,
        })(<input type="hidden" />)}
        <div className={this.state.items[position]![2] ? '' : 'hide'}>
          {fields.map((f: any) => this.renderField(f, key, index))}
        </div>
      </Card>
    );
  };

  public render() {
    const { items } = this.state;
    const { field } = this.props;
    const repeated = this.options.repeated;

    if (field.fields.length === 0) {
      return null;
    }

    return (
      <Form.Item label={field.title} className="prime-group">
        {items.map(this.renderGroupItem)}
        {repeated && (
          <div style={{ textAlign: 'center' }}>
            <Button
              size="large"
              shape="circle"
              onClick={this.add}
              icon="plus"
              className="prime-slice-add"
            />
          </div>
        )}
      </Form.Item>
    );
  }
}
