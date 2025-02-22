import { useEffect, useRef, useState } from 'react'
// import './App.css'
import axios from 'axios';
import { Modal } from 'bootstrap';
import apiPath from '../apiPath';  //API路徑檔案

function App() {
  //登入資料物件
  const [userData, setUserData] = useState({
    username:'',
    password:''
  });

  //驗證是否登入
  const [isLogIn, setIsLogIn] = useState(false);

  //登入畫面帳號密碼處理
  const handle = (e) => {
    const {name, value} = e.target;
    setUserData({
      ...userData,
      [name]: value
    });
  };

  //產品狀態
  const [product, setProduct] = useState({});

  //產品是否有撈回來
  const [productList, setProductList] = useState([]);

  //獲取產品列表
  const getProduct = () => {
    axios.get(`${BASE_URL}v2/api/${API_PATH}/admin/products`)
        .then(res => {
          setProductList(res.data.products)
        })
        .catch(err => console.error())
  }

  //登入處理
  const handleLogIn = (e) => {
    e.preventDefault();
    axios.post(`${BASE_URL}${apiPath.signInPath}`, userData)
      .then(res => {
        setIsLogIn(true);
        const {token, expired} = res.data;

        //token存進cookie
        document.cookie = `Token=${token}; expires=${new Date(expired)}`;

        //請求自動帶入token
        axios.defaults.headers.common['Authorization'] = token;

        getProduct();
      })
      .catch(err =>{
        alert("帳號或密碼錯誤");
        console.log(err);
      })
  };

  //驗證是否登入成功
  const checkUserLogIn = async () => {
    try {
      await axios.post(`${BASE_URL}${apiPath.signInCheck}`)
      getProduct();
      setIsLogIn(true);
    } catch (error) {
      console.error(error);
    }
  }

  // useEffect(() => {
  //   const token = document.cookie.replace(
  //     /(?:(?:^|.*;\s*)Token\s*\=\s*([^;]*).*$)|^.*$/,
  //     "$1",
  //   );
  //   axios.defaults.headers.common['Authorization'] = token;

  //   checkUserLogIn();
  // }, [])

  //登出處理
  const handleLogOut = () => {
    setIsLogIn(false);
  };

  //登入頁面帳號密碼清除
  const handleClear = () => {
    setUserData({
      username:'',
      password:''
    });
  };

  //取得modal元素
  const productModalRef = useRef(null);
  const delproductModalRef = useRef(null);


  //modal模式
  const [modalMode, setModalMode] = useState(null);

  //modal預設狀態
  const modalDefaultData = {
    imageUrl: "",
    title: "",
    category: "",
    unit: "",
    origin_price: "",
    price: "",
    description: "",
    content: "",
    is_enabled: 0,
    imagesUrl: [""]
  };

  //modal帶入的值
  const [modalData, setModalData] = useState(modalDefaultData);

  const handleModalInputChange = (e) => {
    const {value, name, checked, type} = e.target;
    setModalData({
      ...modalData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  useEffect(() => {
    //建立modal實體
    new Modal(productModalRef.current, {
      backdrop: false
    });
    
    new Modal(delproductModalRef.current, {
      backdrop: false
    });

  }, [])

  // //開啟modal
  const handleOpenProductModal = (mode, product) => {
    if(mode === 'edit'){
      setModalMode('編輯產品');
    }else{
      setModalMode('新增產品')
    }
    setModalData(product);

    const modalInstance = Modal.getInstance(productModalRef.current);
    modalInstance.show();
  }

  // //關閉modal
  const handleCloseProductModal = () => {
    const modalInstance = Modal.getInstance(productModalRef.current);
    modalInstance.hide();
  }

  //開啟刪除modal
  const handleOpenDelProductModal = (product) => {
    setModalData(product);

    const modalInstance = Modal.getInstance(delproductModalRef.current);
    modalInstance.show();
  }

  //關閉刪除modal
  const handleCloseDelProductModal = () => {
    const modalInstance = Modal.getInstance(delproductModalRef.current);
    modalInstance.hide();
  }

  const handleImageChange = (e, index) => {
    const {value} = e.target;
    const newImages = [...modalData.imagesUrl];
    newImages[index] = value;

    setModalData({
      ...modalData,
      imagesUrl : newImages
    })
  }

  //modal新增圖片
  const handleAddImage = () => {
    const newImages = [...modalData.imagesUrl, ''];

    setModalData({
      ...modalData,
      imagesUrl : newImages
    })
  }

  //modal取消圖片
  const handleRemoveImage = () => {
    const newImages = [...modalData.imagesUrl];
    newImages.pop(); //刪除最後一個

    setModalData({
      ...modalData,
      imagesUrl : newImages
    })
  }

  //modal 新增產品
  const addProduct = async () => {
    try {
      await axios.post(`${BASE_URL}v2/api/${API_PATH}/admin/product`, {
        data:{
          ...modalData,
          origin_price: Number(modalData.origin_price),
          price: Number(modalData.price),
          is_enabled: modalData.is_enabled ? 1 : 0
        }
      })
      console.log('新增成功');
    } catch (error) {
      alert('新增產品失敗');
    }
  }

  //modal 編輯產品
  const updateProduct = async () => {
    try {
      await axios.put(`${BASE_URL}v2/api/${API_PATH}/admin/product/${modalData.id}`, {
        data:{
          ...modalData,
          origin_price: Number(modalData.origin_price),
          price: Number(modalData.price)
        }
      })
      console.log('編輯成功');
    } catch (error) {
      alert('編輯產品失敗');
    }
  }

  //新增產品 按下確認則送出
  const handleUpdateProduct = async () => {
    //判斷是新增或編輯產品
    const apiChoise = modalMode === '編輯產品' ? updateProduct : addProduct;

    try {
      //新增產品戳完API後 還要取得產品才會更新產品列表 並關閉modal
      await apiChoise();
      getProduct();
      handleCloseProductModal();
    } catch (error) {
      alert('編輯產品失敗');
    }
  }

  //刪除產品
  const deleteProduct = async () => {
    try {
      axios.delete(`${BASE_URL}v2/api/${API_PATH}/admin/product/${modalData.id}`, {
          data:{
            ...modalData,
            origin_price: Number(modalData.origin_price),
            price: Number(modalData.price)
          }
        }
      )  
    } catch (error) {
      alert('刪除產品失敗');
    }
    
  }

  const handleDeleteProduct = async () => {
    try {
      //刪除產品戳完API後 還要取得產品才會更新產品列表 並關閉modal
      await deleteProduct();
      getProduct();
      handleCloseDelProductModal();
    } catch (error) {
      alert('刪除產品失敗');
    }
  }


  return (
    <>
      {isLogIn ? 
        <div className="container mt-3">
					<div className="row">
						<div className="col-12">
              <div className="d-flex justify-content-between align-items-center my-3">
                <h2 className="text-center">產品列表</h2>
                <button type="button" className='btn btn-primary' onClick={() => {handleOpenProductModal('add', modalDefaultData)}}>建立新的產品</button>
              </div>
							<table className="table">
								<thead>
									<tr className="fs-4 text-primary">
										<th scope="col">產品名稱</th>
										<th scope="col">原價</th>
										<th scope="col">售價</th>
										<th scope="col">是否啟用</th>
										<th scope="col"></th>
									</tr>
								</thead>
								<tbody>
									{productList.map((product) => (
										<tr className="fs-5" key={product.id}>
											<th scope="row">{product.title}</th>
											<td>{product.origin_price}</td>
											<td>{product.price}</td>
											<td className={product.is_enabled && 'text-success'}>{product.is_enabled ? '啟用' : '未啟用'}</td>
											<td>
                        <div className="btn-group gap-3">
                          <button type="button" className='btn btn-outline-primary rounded-3' onClick={() => {handleOpenProductModal('edit', product)}}>編輯</button>
                          <button type="button" className='btn btn-outline-danger rounded-3' onClick={() => {
                            handleOpenDelProductModal(product);
                          }}>刪除</button>
                        </div>
                      </td>
                      
										</tr>
								))}
								</tbody>
							</table>
						</div>
						<div className="col-6">
          </div>
				</div>
        </div> : 
      <div className='d-flex flex-column '>
        <h1 className='text-center'>請先登入</h1>
        <form id="logInForm" style={{border: '3px solid gray', margin: '10px auto', padding: '10px 0', width: '30%'}}>
          <div className="text-center mt-3">
            <label htmlFor="account" className="me-3 fs-5 w-100">帳號</label>
            <input id="account" name="username" value={userData.username} onChange={handle} className='w-75' />
          </div>
          <div className="text-center mt-3">
            <label htmlFor="password" className="me-3 fs-5 w-100">密碼</label>
            <input type="password" id="password" name="password" value={userData.password} onChange={handle} className='w-75' />
          </div>
          <div className="d-flex justify-content-center gap-3">
            <button className="mt-3 px-3 btn btn-primary" onClick={handleLogIn}>登入</button>
            <button type="button" className="mt-3 px-3 btn btn-secondary" onClick={handleClear}>清除</button>
          </div>
        </form>
      </div>}

      {/* modal */}
      <div ref={productModalRef} id="productModal" className="modal" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content border-0 shadow">
            <div className="modal-header border-bottom">
              <h5 className="modal-title fs-4">{modalMode}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={handleCloseProductModal}></button>
            </div>

            <div className="modal-body p-4">
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="mb-4">
                    <label htmlFor="primary-image" className="form-label">
                      主圖
                    </label>
                    <div className="input-group">
                      <input
                        value={modalData.imageUrl}
                        onChange={handleModalInputChange}
                        name="imageUrl"
                        type="text"
                        id="primary-image"
                        className="form-control"
                        placeholder="請輸入圖片連結"
                      />
                    </div>
                    <img
                      src={modalData.imageUrl}
                      alt={modalData.title}
                      className="img-fluid"
                    />
                  </div>

                  {/* 副圖 */}
                  <div className="border border-2 border-dashed rounded-3 p-3">
                    {modalData.imagesUrl?.map((image, index) => (
                      <div key={index} className="mb-2">
                        <label
                          htmlFor={`imagesUrl-${index + 1}`}
                          className="form-label"
                        >
                          副圖 {index + 1}
                        </label>
                        <input
                          value={image}
                          onChange={(e) => {handleImageChange(e, index)}}
                          id={`imagesUrl-${index + 1}`}
                          type="text"
                          placeholder={`圖片網址 ${index + 1}`}
                          className="form-control mb-2"
                        />
                        {image && (
                          <img
                            src={image}
                            alt={`副圖 ${index + 1}`}
                            className="img-fluid mb-2"
                          />
                        )}
                      </div>
                    ))}

                    {/* 副圖小於3張 並且最後一張圖有值 則顯示新增圖片按鈕 */}
                    <div className="btn-group w-100 gap-3">
                      {modalData.imagesUrl.length < 3 && modalData.imagesUrl[modalData.imagesUrl.length - 1] !== '' && (
                        <button className="btn btn-outline-primary btn-sm w-100 rounded-2" onClick={handleAddImage}>新增圖片</button>
                      )}

                      {/* 副圖大於1張 並且有值 則顯示取消圖片按鈕 */}
                      {modalData.imagesUrl.length > 1 && (
                        <button className="btn btn-outline-danger btn-sm w-100 rounded-2" onClick={handleRemoveImage}>取消圖片</button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-md-8">
            <div className="mb-3">
              <label htmlFor="title" className="form-label">
                標題
              </label>
              <input
                value={modalData.title}
                onChange={handleModalInputChange}
                name="title"
                id="title"
                type="text"
                className="form-control"
                placeholder="請輸入標題"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="category" className="form-label">
                分類
              </label>
              <input
                value={modalData.category}
                onChange={handleModalInputChange}
                name="category"
                id="category"
                type="text"
                className="form-control"
                placeholder="請輸入分類"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="unit" className="form-label">
                單位
              </label>
              <input
                value={modalData.unit}
                onChange={handleModalInputChange}
                name="unit"
                id="unit"
                type="text"
                className="form-control"
                placeholder="請輸入單位"
              />
            </div>

            <div className="row g-3 mb-3">
              <div className="col-6">
                <label htmlFor="origin_price" className="form-label">
                  原價
                </label>
                <input
                  value={modalData.origin_price}
                  onChange={handleModalInputChange}
                  name="origin_price"
                  id="origin_price"
                  type="number"
                  className="form-control"
                  placeholder="請輸入原價"
                />
              </div>
              <div className="col-6">
                <label htmlFor="price" className="form-label">
                  售價
                </label>
                <input
                  value={modalData.price}
                  onChange={handleModalInputChange}
                  name="price"
                  id="price"
                  type="number"
                  className="form-control"
                  placeholder="請輸入售價"
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="description" className="form-label">
                產品描述
              </label>
              <textarea
                value={modalData.description}
                onChange={handleModalInputChange}
                name="description"
                id="description"
                className="form-control"
                rows={4}
                placeholder="請輸入產品描述"
              ></textarea>
            </div>

            <div className="mb-3">
              <label htmlFor="content" className="form-label">
                說明內容
              </label>
              <textarea
                value={modalData.content}
                onChange={handleModalInputChange}
                name="content"
                id="content"
                className="form-control"
                rows={4}
                placeholder="請輸入說明內容"
              ></textarea>
            </div>

            <div className="form-check">
              <input
                checked={modalData.is_enabled}
                onChange={handleModalInputChange}
                name="is_enabled"
                type="checkbox"
                className="form-check-input"
                id="isEnabled"
              />
              <label className="form-check-label" htmlFor="isEnabled">
                是否啟用
              </label>
            </div>
                </div>
              </div>
            </div>

            <div className="modal-footer border-top bg-light">
              <button type="button" className="btn btn-secondary" onClick={handleCloseProductModal}>
                取消
              </button>
              <button type="button" className="btn btn-primary" onClick={handleUpdateProduct}>
                確認
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 關閉modal */}
      <div 
          ref={delproductModalRef}
          className="modal fade"
          id="delProductModal"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div  className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5">刪除產品</h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={handleCloseDelProductModal}
              ></button>
            </div>
            <div className="modal-body">
              你是否要刪除 
              <span className="text-danger fw-bolder">"{modalData.title}"</span>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseDelProductModal}
              >
                取消
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteProduct}>
                刪除
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
