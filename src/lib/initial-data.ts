
import type { Position, Personnel } from './types';

// Let's create some UUIDs for our initial personnel
const personnelIds = {
  ekremAcar: 'c2759868-2f84-4113-8b77-2b477610f74a',
  erkanIcil: 'a87a2244-9387-4fb4-a53d-24d47159759d',
  muratYildirim: 'b98b3355-8498-5ac5-b64e-35e58260860e',
  salihCakmak: 'd99c4466-7509-6bd6-c75f-46f69371971f',
  aliYilmaz: 'e11d5577-6610-7ce7-d860-570704820820',
  israfilKayhan: 'f22e6688-5721-8df8-e971-681815931931',
  recepCin: 'g33f7799-4832-9e09-fa82-792926042042',
  semaDoganyigit: 'h4408800-3943-0f10-0b93-803037153153',
  mustafaCanseven: 'i5519911-2054-1021-1ca4-914148264264',
  sercanYalcinkaya: 'j6620022-1165-2132-2db5-025259375375',
  ozgeParmaksiz: 'k7731133-0276-3243-3ec6-136360486486',
};


export const initialPersonnelData: Personnel[] = [
    { id: personnelIds.ekremAcar, firstName: 'Ekrem', lastName: 'Acar', registryNumber: '239089', status: 'İHS', unvan: 'Genel Müdür', email: 'ekrem.acar@ptt.gov.tr', phone: '555-111-2233' },
    { id: personnelIds.erkanIcil, firstName: 'Erkan', lastName: 'İçil', registryNumber: '240637', status: 'İHS', unvan: 'Daire Başkanı', email: 'erkan.icil@ptt.gov.tr', phone: '555-222-3344' },
    { id: personnelIds.muratYildirim, firstName: 'Murat', lastName: 'Yıldırım', registryNumber: '213964', status: '399', unvan: 'Genel Müdür Yardımcısı', email: 'murat.yildirim@ptt.gov.tr', phone: '555-333-4455' },
    { id: personnelIds.salihCakmak, firstName: 'Salih', lastName: 'Çakmak', registryNumber: '248143', status: '399', unvan: 'Daire Başkanı', email: 'salih.cakmak@ptt.gov.tr', phone: '555-444-5566' },
    { id: personnelIds.aliYilmaz, firstName: 'Ali', lastName: 'Yılmaz', registryNumber: '215812', status: 'İHS', unvan: 'Şube Müdürü', email: 'ali.yilmaz@ptt.gov.tr', phone: '555-555-6677' },
    { id: personnelIds.israfilKayhan, firstName: 'İsrafil', lastName: 'Kayhan', registryNumber: '239628', status: '399', unvan: 'Şube Müdürü', email: 'israfil.kayhan@ptt.gov.tr', phone: '555-666-7788' },
    { id: personnelIds.recepCin, firstName: 'Recep', lastName: 'Cin', registryNumber: '242202', status: 'İHS', unvan: 'Uzman', email: 'recep.cin@ptt.gov.tr', phone: '555-777-8899' },
    { id: personnelIds.semaDoganyigit, firstName: 'Sema Betül', lastName: 'Doğanyiğit', registryNumber: '251469', status: '399', unvan: 'Daire Başkanı', email: 'sema.doganyigit@ptt.gov.tr', phone: '555-888-9900' },
    { id: personnelIds.mustafaCanseven, firstName: 'Mustafa Dursun', lastName: 'Canseven', registryNumber: '258311', status: 'İHS', unvan: 'Başmüfettiş', email: 'mustafa.canseven@ptt.gov.tr', phone: '555-999-0011' },
    { id: personnelIds.sercanYalcinkaya, firstName: 'Sercan Emre', lastName: 'Yalçınkaya', registryNumber: '255197', status: '399', unvan: 'Uzman', email: 'sercan.yalcinkaya@ptt.gov.tr', phone: '555-000-1122' },
    { id: personnelIds.ozgeParmaksiz, firstName: 'Özge', lastName: 'Parmaksız', registryNumber: '254841', status: 'İHS', unvan: 'Mühendis', email: 'ozge.parmaksiz@ptt.gov.tr', phone: '555-111-2234' },
];

const positionIds = {
    genelMudur: 'pos-01',
    genelMudurYardimcisi: 'pos-02',
    btDaireBaskani: 'pos-03',
    ikDaireBaskani: 'pos-04',
    destekDaireBaskani: 'pos-05',
    btSubeMudur: 'pos-06',
    ikSubeMudur: 'pos-07',
    btUzman1: 'pos-08',
    ikUzman1: 'pos-09',
    btMuhendis1: 'pos-10',
    teftisBaskani: 'pos-11',
};

export const initialPositionsData: Position[] = [
    { id: positionIds.genelMudur, name: 'Genel Müdür', department: 'Genel Müdürlük', status: 'Asıl', reportsTo: null, assignedPersonnelId: personnelIds.ekremAcar, startDate: new Date('2022-01-15') },
    { id: positionIds.genelMudurYardimcisi, name: 'Genel Müdür Yardımcısı', department: 'Genel Müdürlük', status: 'Asıl', reportsTo: positionIds.genelMudur, assignedPersonnelId: personnelIds.muratYildirim, startDate: new Date('2022-02-20') },
    { id: positionIds.btDaireBaskani, name: 'Daire Başkanı', department: 'Bilgi Teknolojileri Daire Başkanlığı', status: 'Asıl', reportsTo: positionIds.genelMudurYardimcisi, assignedPersonnelId: personnelIds.erkanIcil, startDate: new Date('2023-05-10') },
    { id: positionIds.ikDaireBaskani, name: 'Daire Başkanı', department: 'İnsan Kaynakları Daire Başkanlığı', status: 'Asıl', reportsTo: positionIds.genelMudurYardimcisi, assignedPersonnelId: personnelIds.salihCakmak, startDate: new Date('2023-03-01') },
    { id: positionIds.destekDaireBaskani, name: 'Daire Başkanı', department: 'Destek Hizmetleri Daire Başkanlığı', status: 'Asıl', reportsTo: positionIds.genelMudurYardimcisi, assignedPersonnelId: personnelIds.semaDoganyigit, startDate: new Date('2021-11-11') },
    { id: positionIds.btSubeMudur, name: 'Şube Müdürü', department: 'Bilgi Teknolojileri Daire Başkanlığı', dutyLocation: 'Yazılım Geliştirme', status: 'Asıl', reportsTo: positionIds.btDaireBaskani, assignedPersonnelId: personnelIds.israfilKayhan, startDate: new Date('2023-06-01') },
    { id: positionIds.ikSubeMudur, name: 'Şube Müdürü', department: 'İnsan Kaynakları Daire Başkanlığı', dutyLocation: 'İşe Alım', status: 'Asıl', reportsTo: positionIds.ikDaireBaskani, assignedPersonnelId: personnelIds.aliYilmaz, startDate: new Date('2022-08-18') },
    { id: positionIds.btUzman1, name: 'Uzman', department: 'Bilgi Teknolojileri Daire Başkanlığı', dutyLocation: 'Yazılım Geliştirme', status: 'Asıl', reportsTo: positionIds.btSubeMudur, assignedPersonnelId: personnelIds.recepCin, startDate: new Date('2024-01-05') },
    { id: positionIds.ikUzman1, name: 'Uzman', department: 'İnsan Kaynakları Daire Başkanlığı', dutyLocation: 'İşe Alım', status: 'Vekalet', reportsTo: positionIds.ikSubeMudur, assignedPersonnelId: personnelIds.sercanYalcinkaya, startDate: new Date('2024-02-10'), originalTitle: 'Memur' },
    { id: positionIds.btMuhendis1, name: 'Mühendis', department: 'Bilgi Teknolojileri Daire Başkanlığı', dutyLocation: 'Sistem Yönetimi', status: 'Boş', reportsTo: positionIds.btSubeMudur, assignedPersonnelId: null, startDate: null },
    { id: positionIds.teftisBaskani, name: 'Rehberlik ve Teftiş Başkanı', department: 'Rehberlik ve Teftiş Başkanlığı', status: 'Asıl', reportsTo: positionIds.genelMudur, assignedPersonnelId: personnelIds.mustafaCanseven, startDate: new Date('2020-07-30') },
];
