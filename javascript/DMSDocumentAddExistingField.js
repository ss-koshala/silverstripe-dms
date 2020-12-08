(function ($) {
  "use strict";

  $.entwine('ss', function ($) {
    $('.document-add-existing').entwine({
      adddocument: function (document_id) {
        var documentSetId = $(this).closest('form').find('input[name="DSID"]').val();

        jQuery.ajax(
          'admin/pages/adddocument/linkdocument?dsid=' + documentSetId + '&documentID=' + document_id,
          {
            dataType: 'json',
            success: function (data, textstatus) {

              let html  = '<li class="ss-uploadfield-item template-download';

              if(data.error) {
                html += 'ui-state-error " ';
              } else {
                html += ' " ';
              }

              html += 'data-fileid=" '+data.id+' ">' +
                '<div class="ss-uploadfield-item-preview"><span>' +
                '<img src=" '+data.thumbnail_url+' " alt="" />' +
                '</span></div>' +
                '<div class="ss-uploadfield-item-info">' +
                '<label class="ss-uploadfield-item-name">' +
                '<span class="name" title="'+ data.name +'">'+ data.name +'</span>';

              if(!data.error) {
                html += '<div class="ss-uploadfield-item-status ui-state-success-text" title="'+
                  ss.i18n._t('UploadField.AddedToDocumentSet', 'Added to Document Set')+'">'+
                  ss.i18n._t('UploadField.AddedToDocumentSet', 'Added to Document Set')+'</div>';
              } else {
                html += '<div class="ss-uploadfield-item-status ui-state-error-text" ' +
                  'title="'+options.errorMessages[data.error] || data.error +'"> '+ options.errorMessages[data.error] || data.error +'</div>';
              }

              html += '<div class="clear"><!-- --></div></label>';

              if(data.error) {
                html += '<div class="ss-uploadfield-item-actions">' +
                  '<div class="ss-uploadfield-item-cancel ss-uploadfield-item-cancelfailed">' +
                  '<button class="icon icon-16">' + ss.i18n._t('UploadField.CANCEL', 'Cancel') + '</button></div></div>';
              } else {
                html += '<div class="ss-uploadfield-item-actions">'+ data.buttons +'</div>';
              }

              html += '</div>';

              if(!data.error) {
                html += '<div class="ss-uploadfield-item-editform loading">' +
                  '<iframe frameborder="0" src="'+ data.edit_url +'" style="width: 60%;"></iframe></div>';
              }

              html += '</li>';

              // var fn = window.tmpl.cache['ss-uploadfield-addtemplate'];
              // var fnout = fn({
              //   files: [data],
              //   formatFileSize: function (bytes) {
              //     if (typeof bytes !== 'number') {
              //       return '';
              //     }
              //     if (bytes >= 1000000000) {
              //       return (bytes / 1000000000).toFixed(2) + ' GB'
              //     }
              //     if (bytes >= 1000000) {
              //       return (bytes / 1000000).toFixed(2) + ' MB';
              //     }
              //     return (bytes / 1000).toFixed(2) + ' KB';
              //   }
              // });

              $('.ss-add-files').append(html);
            }
          }
        );
      },
      selectdocument: function (documentID, documentName) {
        if (typeof(documentID) !== "undefined") {
          // Substitute the ID for the full document name, if no name is present
          if (typeof(documentName) === "undefined") {
            documentName = documentID;
          }
          $('.ss-add-files').html('<div class="selected-document" data-document-id="'+documentID+'">'+documentName+'</div>');
        } else {
          $('.ss-add-files').html('');
        }
      }
    });

    $('.document-add-existing .document-autocomplete').entwine({
      onmatch: function () {
        var self = this;
        this.autocomplete({
          source: 'admin/pages/adddocument/documentautocomplete',
          select: function (event, ui) {
            if (ui.item) {
              if (self.closest('.document-add-existing').hasClass('link-editor-context')) {
                $(this).closest('.document-add-existing').selectdocument(ui.item.value, ui.item.label);
              } else {
                $(this).closest('.document-add-existing').adddocument(ui.item.value);
              }

              $(this).val('');

              return false;
            }
          }
        });
      }
    });

    // Add label to tree drop down button
    $('.document-add-existing .treedropdownfield-toggle-panel-link').entwine({
      onmatch: function () {
        this.prepend('<span>Browse by page</span>');
      }
    });

    $('.document-add-existing .TreeDropdownField').entwine({
      onpanelshow: function () {
        $(this).closest('.document-add-existing').find('input.document-autocomplete').prop('disabled', true);
      },
      onpanelhide: function () {
        $(this)
          .closest('.document-add-existing')
          .find('input.document-autocomplete')
          .prop('disabled', $(this).closest('.document-add-existing').find('.document-list:visible').length > 0);
      }
    });

    $('.document-add-existing input[name=PageSelector]').entwine({
      onchange: function (event) {
        var doclist = $(this).closest('.document-add-existing').find('.document-list');
        doclist.html('<p>Loading...</p>');
        doclist.show();
        doclist.load(
          'admin/pages/adddocument/documentlist?pageID=' + $(this).val()
        );
      }
    });

    $('.document-add-existing a.add-document').entwine({
      onclick: function (event) {
        var document_id = this.data('document-id');
        var dae = this.closest('.document-add-existing');

        if (dae.hasClass('link-editor-context')) {
          dae.selectdocument(document_id, this.text());
        } else {
          dae.adddocument(document_id);
        }

        $(this).closest('.document-list').hide();
        $(this).closest('.document-add-existing').find('input.document-autocomplete').prop('disabled', false);

        return false;
      }
    });

    $('body').entwine({
      onclick: function (event) {
        $('.document-list:visible')
          .hide()
          .closest('.document-add-existing')
          .find('input.document-autocomplete')
          .prop('disabled', false);
      }
    });

    $('.document-add-existing .treedropdownfield-toggle-panel-link').entwine({
      onclick: function (event) {
        $('.document-list:visible').hide();
      }
    });
  });
}(jQuery));
