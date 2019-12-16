import React from 'react'
import {UploadChangeParam, UploadFile} from "antd/lib/upload/interface";
import { Icon, Upload } from 'antd';

type Props = {
  file: any,
  onChange: (info: UploadChangeParam) => void,
  onPreview: (file: UploadFile) => void,
  env: {
    CLOUDINARY_URL: string,
  },
}

export default class CloudinaryUpload extends React.PureComponent<Props> {
  public state = {
    uploadPayload: {
      signature: '',
      timestamp: 0,
    },
  };

  public url = (() => {
    try {
      return new URL(
        String(this.props.env.CLOUDINARY_URL).replace(/^cloudinary/, 'http')
      );
    } catch (err) {
      console.warn('No "CLOUDINARY_URL" set'); // tslint:disable-line no-console
    }

    return new URL('http://localhost');
  })();

  public onBeforeUpload = async () => {
    const { username, password } = this.url;

    const timestamp = Math.round(Date.now() / 1000);
    const params = {
      upload_preset: 'prime-asset',
      image_metadata: true,
      timestamp,
    };

    const toSign = Object.entries(params)
      .filter(([key, value]) => value && String(value).length > 0)
      .map(([key, value]: [string, any]) => `${key}=${[].concat(value || []).join(',')}`)
      .sort()
      .join('&');

    const msgBuffer = new TextEncoder().encode(toSign + password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => `00${b.toString(16)}`.slice(-2)).join('');

    this.setState({
      uploadPayload: {
        signature: hashHex,
        api_key: username,
        ...params,
      },
    });
  };

  public render() {
    const { file, onPreview, onChange } = this.props;
    const { uploadPayload } = this.state;

    return (
      <Upload
        name="file"
        action={`https://api.cloudinary.com/v1_1/${this.url.hostname}/upload`}
        data={uploadPayload}
        listType="picture-card"
        multiple={false}
        beforeUpload={this.onBeforeUpload}
        onChange={onChange}
        onPreview={onPreview}
        fileList={((file ? [file] : []) as unknown) as UploadFile[]}
      >
        {!file && (
          <div>
            <Icon type="plus" />
            <div className="ant-upload-text">Upload</div>
          </div>
        )}
      </Upload>
    )
  }
}
