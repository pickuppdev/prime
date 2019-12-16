import React from 'react'
import AWS from 'aws-sdk';
import { UploadChangeParam, UploadFile } from "antd/lib/upload/interface";
import { Icon, Upload } from 'antd';
import { randomBytes } from 'crypto';

type Props = {
  file: any,
  onChange: (info: UploadChangeParam) => void,
  onPreview: (file: UploadFile) => void,
  env: {
    AWS_ACCESS_KEY_ID: string,
    AWS_SECRET_ACCESS_KEY: string,
    AWS_REGION: string,
    AWS_BUCKET: string,
    S3_LINK_EXPIRY: Date,
  }
}

export default class S3Upload extends React.PureComponent<Props> {
  public componentDidMount() {
    const { env } = this.props;
    AWS.config.update({
      region: env.AWS_REGION,
      credentials: new AWS.Credentials({
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      })
    });
  }

  public customRequest = async ({ file, onSuccess }) => {
    const s3 = new AWS.S3;
    const { env } = this.props

    const prefix = randomBytes(20).toString('hex')
    const fileName = `${prefix}_${file.name}`
    const data = await s3.upload({
      Bucket: env.AWS_BUCKET,
      Key: `prime/${fileName}`,
      ContentType: file.type,
      ACL: 'public-read',
      Expires: env.S3_LINK_EXPIRY,
      Body: file,
    }).promise();

    onSuccess({
      url: data.Location,
    }, {
      ...file,
      url: data.Location,
      imageUrl: data.Location,
      thumbUrl: data.Location,
      status: 'done',
      response: data,
    })
  };

  public render() {
    const { file, onPreview, onChange } = this.props;
    return (
      <Upload
        name="file"
        listType="picture-card"
        multiple={false}
        onChange={onChange}
        onPreview={onPreview}
        customRequest={this.customRequest}
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
