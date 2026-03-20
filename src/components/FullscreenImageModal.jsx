import PropTypes from 'prop-types'

function FullscreenImageModal({ imagePath, fullImageRef, onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-30 bg-[rgba(20,34,69,.45)]" onClick={onClose} />
      <div className="fixed inset-0 z-50 grid place-items-center p-5">
        <button className="fixed right-4 top-4 z-[52] rounded-xl bg-gradient-to-br from-[#ff7eb4] to-[#ff9bc2] px-3 py-2.5 text-sm font-extrabold text-white" onClick={onClose}>关闭全屏</button>
        <img ref={fullImageRef} src={imagePath} alt="全屏图片" className="max-h-[92vh] max-w-[96vw] rounded-2xl border-2 border-[#d6e5ff] bg-white shadow-[0_18px_35px_rgba(0,0,0,.35)]" />
      </div>
    </>
  )
}

FullscreenImageModal.propTypes = {
  imagePath: PropTypes.string.isRequired,
  fullImageRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  onClose: PropTypes.func.isRequired
}

export default FullscreenImageModal
