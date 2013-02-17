<?php
// GoogleTest.php
// должны быть установлены PEAR-пакеты
// сам PEAR должен быть в include_path
require_once 'PHPUnit/Framework/TestCase.php';
require 'php-webdriver/__init__.php';

class RealtyTest extends PHPUnit_Framework_TestCase
{
    /**
     * @var WebDriverSession
     */
    public $session;

    public function setUp()
    {
        $webdriver = new WebDriver(is_file('selenium.dev.url') ? file_get_contents('selenium.dev.url') : file_get_contents('selenium.url'));

        try {
            $this->session = $webdriver->session();
        } catch (Exception $e) {
            var_dump($e);
        }

    }

    public function tearDown()
    {
        if ($this->session) {
            $this->session->close();
        }
    }

    private function isNot404($url) {
        $this->session->open($url);

        try {
            $this->assertNull($this->session->element('class name', 'server_error_list__code'), "Non 404 assertion failed for $url");
        } catch (NoSuchElementWebDriverError $allisOk) {

        }
    }

    public function testGoogle()
    {
        $this->session->open("http://realty.mail.ru/");


        $links = $this->session->elements('tag name', 'a');

        $testedUrls = array();

        foreach ($links as $link) {
            /**
             * @var $link WebDriverElement
             */

            $href = $link->attribute('href');

            if (preg_match('~/realty.mail.ru/$~', $href) || preg_match('~/realty.mail.ru/#~', $href)) {
                echo "Ignore main link " . $href . PHP_EOL;
            } else   if (preg_match('~/realty.mail.ru~', $href)) {
                echo "DO LINK $href\n";
                $testedUrls[] = $href;
            } else {
                echo "Ignore link " . $href . PHP_EOL;
            }

        }

        $skip_city = false;

        foreach ($testedUrls as $url) {
            if ($skip_city && preg_match('~http://realty.mail.ru/[a-z]*/$~', $url)) {
                echo "Skip city " . $href . PHP_EOL;
            } else {
                $this->isNot404($url);
            }
        }
     }
}
