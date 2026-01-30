import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { userAPI } from '../../services/api';

const UpdateUserInfo = () => {
  const navigate = useNavigate();
  const { account } = useParams();
  const [formData, setFormData] = useState({
    memberAccount: account,
    memberName: '',
    memberGender: '',
    memberAge: '',
    memberHeight: '',
    memberWeight: '',
    memberPhone: '',
    memberPhoto: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMember();
  }, [account]);

  const fetchMember = async () => {
    try {
      const response = await userAPI.getInfo(account);
      if (response.data.success) {
        const member = response.data.data;
        setFormData({
          memberAccount: member.member_account,
          memberName: member.member_name || '',
          memberGender: member.member_gender || '',
          memberAge: member.member_age || '',
          memberHeight: member.member_height || '',
          memberWeight: member.member_weight || '',
          memberPhone: member.member_phone || '',
          memberPhoto: member.member_photo || '',
        });
      }
    } catch (error) {
      setError('加载信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Helper function to safely parse integer
      const safeParseInt = (value) => {
        if (!value || value === '') return null;
        const parsed = parseInt(value);
        return isNaN(parsed) ? null : parsed;
      };

      const updateData = {
        memberAccount: parseInt(formData.memberAccount),
        memberName: formData.memberName,
        memberGender: formData.memberGender,
        memberAge: safeParseInt(formData.memberAge),
        memberHeight: safeParseInt(formData.memberHeight),
        memberWeight: safeParseInt(formData.memberWeight),
        memberPhone: safeParseInt(formData.memberPhone),
        memberPhoto: formData.memberPhoto || null,
      };

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b0c20269-a1cb-4b4a-bf8f-a5d0c0463f2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UpdateUserInfo.js:68',message:'Frontend: Preparing update request',data:{hasMemberPhoto:!!updateData.memberPhoto,memberPhotoLength:updateData.memberPhoto?updateData.memberPhoto.length:0,memberPhotoPrefix:updateData.memberPhoto?updateData.memberPhoto.substring(0,50):null,memberAccount:updateData.memberAccount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      const response = await userAPI.updateInfo(updateData);

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b0c20269-a1cb-4b4a-bf8f-a5d0c0463f2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UpdateUserInfo.js:79',message:'Frontend: Received response',data:{success:response.data.success,message:response.data.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      if (response.data.success) {
        // Update session storage
        const memberData = sessionStorage.getItem('member');
        if (memberData) {
          const member = JSON.parse(memberData);
          const safeParseInt = (value) => {
            if (!value || value === '') return null;
            const parsed = parseInt(value);
            return isNaN(parsed) ? null : parsed;
          };
          member.memberName = formData.memberName;
          member.memberGender = formData.memberGender;
          member.memberAge = safeParseInt(formData.memberAge);
          member.memberHeight = safeParseInt(formData.memberHeight);
          member.memberWeight = safeParseInt(formData.memberWeight);
          member.memberPhone = safeParseInt(formData.memberPhone);
          member.memberPhoto = formData.memberPhoto || null;
          sessionStorage.setItem('member', JSON.stringify(member));
        }
        navigate(`/user/info/${account}`);
      } else {
        setError(response.data.message || '更新失败');
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/b0c20269-a1cb-4b4a-bf8f-a5d0c0463f2b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UpdateUserInfo.js:103',message:'Frontend: Error caught',data:{errorMessage:error.message,responseMessage:error.response?.data?.message,status:error.response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      setError(error.response?.data?.message || '更新失败');
    }
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="container-fluid px-4">
          <div className="text-center">加载中...</div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="container-fluid px-4">
        <h1 className="mt-4">修改个人信息</h1>
        <ol className="breadcrumb mb-4">
          <li className="breadcrumb-item">
            <Link to="/user/main">主页</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={`/user/info/${account}`}>个人信息</Link>
          </li>
          <li className="breadcrumb-item active">修改个人信息</li>
        </ol>
        <div className="card mb-4">
          <div className="card-header">
            <i className="bi bi-person-check me-1"></i>
            修改个人信息
          </div>
          <div className="card-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">会员账号</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.memberAccount}
                    disabled
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">姓名</label>
                  <input
                    type="text"
                    className="form-control"
                    name="memberName"
                    value={formData.memberName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">性别</label>
                  <select
                    className="form-control"
                    name="memberGender"
                    value={formData.memberGender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">请选择</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">年龄</label>
                  <input
                    type="number"
                    className="form-control"
                    name="memberAge"
                    value={formData.memberAge}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">身高(cm)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="memberHeight"
                    value={formData.memberHeight}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">体重(kg)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="memberWeight"
                    value={formData.memberWeight}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">电话</label>
                  <input
                    type="text"
                    className="form-control"
                    name="memberPhone"
                    value={formData.memberPhone}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-12">
                  <label className="form-label">会员照片</label>
                  <div className="mb-2">
                    {formData.memberPhoto ? (
                      <img 
                        src={formData.memberPhoto} 
                        alt="预览"
                        className="img-thumbnail"
                        style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="bg-light d-inline-block p-3 rounded">
                        <i className="bi bi-image text-muted"></i>
                        <p className="text-muted mb-0 small">暂无照片</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({
                            ...formData,
                            memberPhoto: reader.result
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <small className="form-text text-muted">可选择本地图片文件上传，或输入图片URL地址</small>
                  <input
                    type="text"
                    className="form-control mt-2"
                    placeholder="或输入图片URL地址（可选）"
                    onChange={(e) => {
                      if (e.target.value) {
                        setFormData({
                          ...formData,
                          memberPhoto: e.target.value
                        });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="mt-4 mb-0">
                <button type="submit" className="btn btn-primary">
                  保存
                </button>
                <Link to={`/user/info/${account}`} className="btn btn-secondary ms-2">
                  取消
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default UpdateUserInfo;
