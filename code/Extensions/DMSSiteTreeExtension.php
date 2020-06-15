<?php

/**
 * @package dms
 */
namespace SilverStripeDMS\Extensions;

use SilverStripe\Forms\FieldList;
use SilverStripe\Forms\GridField\GridField;
use SilverStripe\Forms\GridField\GridFieldAddExistingAutocompleter;
use SilverStripe\Forms\GridField\GridFieldConfig_RelationEditor;
use SilverStripe\ORM\ArrayList;
use SilverStripe\ORM\DataExtension;
use SilverStripe\Security\Member;
use SilverStripe\Security\Permission;
use SilverStripe\Security\Security;
use SilverStripe\Versioned\Versioned;
use SilverStripeDMS\Model\DMSDocumentSet;

class DMSSiteTreeExtension extends DataExtension
{
    private static $has_many = array(
        'DocumentSets' => 'DMSDocumentSet'
    );

    public function updateCMSFields(FieldList $fields)
    {
        // Ability to disable document sets for a Page
        if (!$this->owner->config()->get('documents_enabled')) {
            return;
        }

        // Hides the DocumentSets tab if the user has no permisions
        if (!Permission::checkMember(
            Security::getCurrentUser(),
            array('ADMIN', 'CMS_ACCESS_DMSDocumentAdmin')
        )
        ) {
            return;
        }

        $gridField = GridField::create(
            'DocumentSets',
            false,
            $this->owner->DocumentSets(), //->Sort('DocumentSort'),
            $config = new GridFieldConfig_RelationEditor()
        );
        $gridField->addExtraClass('documentsets');

        // Only show document sets in the autocompleter that have not been assigned to a page already
        $config->getComponentByType(GridFieldAddExistingAutocompleter::class)->setSearchList(
            DMSDocumentSet::get()->filter(array('PageID' => 0))
        );

        $fields->addFieldToTab(
            'Root.DocumentSets',
            $gridField
        );

        $fields
            ->findOrMakeTab('Root.DocumentSets')
            ->setTitle(_t(
                __CLASS__ . '.DocumentSetsTabTitle',
                'Document Sets ({count})',
                array('count' => $this->owner->DocumentSets()->count())
            ));
    }

    /**
     * Get a list of document sets for the owner page
     *
     * @return ArrayList
     */
    public function getDocumentSets()
    {
        return $this->owner->DocumentSets();
    }

    /**
     * Get a list of all documents from all document sets for the owner page
     *
     * @return ArrayList
     */
    public function getAllDocuments()
    {
        $documents = ArrayList::create();

        foreach ($this->getDocumentSets() as $documentSet) {
            /** @var DocumentSet $documentSet */
            $documents->merge($documentSet->getDocuments());
        }
        $documents->removeDuplicates();

        return $documents;
    }

    public function onBeforeDelete()
    {
        if (Versioned::current_stage() == 'Live') {
            $existsOnOtherStage = !$this->owner->getIsDeletedFromStage();
        } else {
            $existsOnOtherStage = $this->owner->getExistsOnLive();
        }

        // Only remove if record doesn't still exist on live stage.
        if (!$existsOnOtherStage) {
            $dmsDocuments = $this->owner->getAllDocuments();
            foreach ($dmsDocuments as $document) {
                // If the document is only associated with one page, i.e. only associated with this page
                if ($document->getRelatedPages()->count() <= 1) {
                    // Delete the document before deleting this page
                    $document->delete();
                }
            }
        }
    }

    public function onBeforePublish()
    {
        $embargoedDocuments = $this->owner->getAllDocuments()->filter('EmbargoedUntilPublished', true);
        if ($embargoedDocuments->count() > 0) {
            foreach ($embargoedDocuments as $doc) {
                $doc->EmbargoedUntilPublished = false;
                $doc->write();
            }
        }
    }

    /**
     * Returns the title of the page with the total number of documents it has associated with it across
     * all document sets
     *
     * @return string
     */
    public function getTitleWithNumberOfDocuments()
    {
        return $this->owner->Title . ' (' . $this->owner->getAllDocuments()->count() . ')';
    }
}
