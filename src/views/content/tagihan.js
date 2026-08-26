
var axios = require('axios');
async function tagihan(body) {
    // let {kode_opd,no_ketetapan,keterangan,kode_rekening,nominal,tahun,tgl_expired,rekening_id,npwrd,nama_wr,kode_objek,tagihan_id} = body
        let kode_opd='1.1.04.01'
        let no_ketetapan='001'
        let keterangan='test pbg'
        let kode_rekening='4.1.02.02.01.0003'
        let nominal=1000
        let tahun=2025
        let tgl_expired = '2025-09-09'
        let rekening_id=67
        let npwrd = 1
        let nama_wr = 'RUSUN'
        let kode_objek = '0021'
       let a = ''
    if (kode_opd) {
        a+='kode_opd='+kode_opd
       }
       if (no_ketetapan) {
        a+= '&no_ketetapan='+no_ketetapan
       }
       if (keterangan) {
        a+='&keterangan='+keterangan
       }
       if (kode_rekening) {
        a+='&kode_rekening='+kode_rekening
       }
       if (nominal) {
        a+=`&nominal=`+nominal
       }
       if (tahun) {
        a+='&tahun='+tahun
       }
       if (rekening_id) {
        a+='&rekening_id='+rekening_id
       }
      if (npwrd) {
        a+='&npwrd='+npwrd
       }   
      if (nama_wr) {
        a+='&nama_wr='+nama_wr
       }
    if (kode_objek) {
        a+='&kode_objek='+kode_objek
       }
           if (tgl_expired) {
        a+='&tgl_expired='+tgl_expired
       }
      const url = 'https://eretribusi.semarangkota.go.id/api/v2/test/retribusi/store?'+a;
      console.log(a);
          var config = {
      method: 'post',
      url: url,
      headers: { 
          'vcode': 'XQv1rcR9',
        'Authorization': 'Bearer QGnyjTnfSR1G76V1bDKEIAcXZ1UOeYi6qR2wiajcgjjC39fTR7E3gtHZ0jVwzwyfF2IGuFvxEykwtzdxwsiJD4fMO8FdMSfeP0nQ', 
        'Content-Type': 'application/json'},
    };
       console.log(config);
          
      let data2 = await  axios(config)
      console.log(data2.data);
      if (data2.data.resp_stat=='success') {
              const url = 'http://survplus.id:8919/tagihan/edit'
          var config2 = {
            method: 'post',
            url: url,
            data:{tagihan_id,status_piutang:data2.data.data.id_billing}
          }
          await  axios(config2).then(function (params) {
            return 'sukses'
          })
      }else{
        return 'error'
      }
}